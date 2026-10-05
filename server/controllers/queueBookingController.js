const crypto = require("crypto");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const S = require("../utils/slotTime");
const Q = require("../utils/queueShift");

const { CONFIRMED_LIMIT, DAILY_MAX } = Q;
const PARTIAL_REFUND = 0.75; // same-day cancel par 25% cut
const DOC_FIELDS = "name fees experience avgRating shiftType avgConsultationTime specialization";

const Counter =
  mongoose.models.QueueCounter ||
  mongoose.model(
    "QueueCounter",
    new mongoose.Schema({ key: { type: String, unique: true }, last: { type: Number, default: 0 } })
  );

const nextSeq = async (doctorId, dateStr) => {
  const c = await Counter.findOneAndUpdate(
    { key: `${doctorId}|${dateStr}` },
    { $inc: { last: 1 } },
    { upsert: true, new: true }
  );
  return c.last;
};

const loadQueue = (doctorId, dateStr) =>
  Appointment.find({ doctor: doctorId, bookingType: "queue", queueDate: dateStr, status: "confirmed" })
    .sort({ priorityDate: 1, seq: 1 });

const countFor = (doctorId, dateStr) =>
  Appointment.countDocuments({
    doctor: doctorId, bookingType: "queue", queueDate: dateStr, status: { $in: ["confirmed", "completed"] },
  });

const placeAt = (index, settings, doctor) => {
  const confirmed = index < CONFIRMED_LIMIT;
  return {
    queueStatus: confirmed ? "confirmed" : "waiting",
    position: confirmed ? index + 1 : null,
    waitingPosition: confirmed ? null : index - CONFIRMED_LIMIT + 1,
    estTime: confirmed ? Q.estimate(settings, doctor, index) : null,
  };
};

const refundPayment = async (paymentId, rupees) => {
  try {
    const Razorpay = require("razorpay");
    const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const opts = { speed: "normal" };
    if (rupees != null) opts.amount = Math.round(rupees * 100);
    const r = await rz.payments.refund(paymentId, opts);
    return r.id;
  } catch (e) {
    console.error("Refund failed:", e?.error?.description || e?.message || e);
    return null;
  }
};

const validateQueueBooking = async (patientId, doctorId) => {
  const doctor = await User.findOne({ _id: doctorId, role: "doctor", bookingType: "queue" });
  if (!doctor) return { status: 404, message: "Doctor not found" };

  const settings = await Q.loadSettings();
  if (!Q.isOpen(settings, doctor)) {
    return { status: 400, message: "Booking is closed for this doctor's shift right now." };
  }
  const queueDate = Q.queueDateFor(settings, doctor);
  if ((await countFor(doctor._id, queueDate)) >= DAILY_MAX) {
    return { status: 409, message: `This doctor is fully booked (${DAILY_MAX}/${DAILY_MAX}).` };
  }
  const { start, end } = S.dayRange(queueDate);
  const already = await Appointment.findOne({
    patient: patientId, date: { $gte: start, $lt: end }, status: { $nin: ["cancelled"] },
  });
  if (already) {
    return { status: 409, message: "You already have an appointment on this date. Only one appointment per day is allowed." };
  }
  return { doctor, settings, queueDate };
};

// GET /queue/availability/:doctorId
exports.getAvailability = async (req, res) => {
  try {
    const v = await validateQueueBooking(req.user._id, req.params.doctorId);
    if (v.message) return res.status(v.status).json({ message: v.message });

    const queue = await loadQueue(v.doctor._id, v.queueDate);
    const place = placeAt(queue.length, v.settings, v.doctor);
    const counter = await Counter.findOne({ key: `${v.doctor._id}|${v.queueDate}` });

    res.json({
      tokenNumber: (counter?.last || 0) + 1,
      ...place,
      timeSlot: place.estTime,
      session: `${Q.shiftOf(v.doctor)} shift · ${v.queueDate}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not check availability" });
  }
};

// POST /queue/book-with-payment
exports.bookWithPayment = async (req, res) => {
  try {
    const { doctorId, reason, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) return res.status(400).json({ message: "Payment verification failed" });

    const v = await validateQueueBooking(req.user._id, doctorId);
    if (v.message) {
      const rid = await refundPayment(razorpay_payment_id);
      return res.status(v.status).json({
        message: `${v.message} ${rid ? "Your payment will be refunded." : `Contact support (Payment ID: ${razorpay_payment_id}).`}`,
      });
    }

    const seq = await nextSeq(v.doctor._id, v.queueDate);
    const appt = await Appointment.create({
      patient: req.user._id,
      doctor: v.doctor._id,
      date: S.toDbDate(v.queueDate),
      timeSlot: `Token #${seq}`,
      reason: reason ? String(reason).slice(0, 500) : undefined,
      status: "confirmed",
      bookingType: "queue",
      queueDate: v.queueDate,
      priorityDate: v.queueDate,
      seq,
      amountPaid: v.doctor.fees || 0,
      paymentStatus: "paid",
      paymentMethod: "online",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    if ((await countFor(v.doctor._id, v.queueDate)) > DAILY_MAX) {
      await Appointment.deleteOne({ _id: appt._id });
      const rid = await refundPayment(razorpay_payment_id);
      return res.status(409).json({
        message: `Doctor just got fully booked. ${rid ? "Your payment will be refunded." : `Contact support (Payment ID: ${razorpay_payment_id}).`}`,
      });
    }
    res.status(201).json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Booking failed. Contact support if money was deducted." });
  }
};

// GET /queue/my
exports.getMyQueue = async (req, res) => {
  try {
    const settings = await Q.loadSettings();
    const from = S.addDays(S.getTodayStr(), -1); // night shift: raat 12 ke baad queueDate kal ki hoti hai
    const appts = await Appointment.find({
      patient: req.user._id, bookingType: "queue", status: "confirmed", queueDate: { $gte: from },
    }).populate("doctor", DOC_FIELDS);

    const out = [];
    for (const a of appts) {
      const queue = await loadQueue(a.doctor._id, a.queueDate);
      const idx = queue.findIndex((q) => String(q._id) === String(a._id));
      if (idx === -1) continue;
      const paid = a.amountPaid ?? a.doctor.fees ?? 0;
      const pct = a.carriedOver ? 1 : PARTIAL_REFUND;
      out.push({
        _id: a._id,
        doctor: { _id: a.doctor._id, name: a.doctor.name, specialization: a.doctor.specialization },
        queueDate: a.queueDate,
        bookingNo: a.seq,
        carriedOver: a.carriedOver,
        peopleAhead: idx,
        ...placeAt(idx, settings, a.doctor),
        amountPaid: paid,
        refundPercent: pct * 100,
        refundAmount: Math.round(paid * pct * 100) / 100,
      });
    }
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load queue" });
  }
};

// POST /queue/:id/cancel
exports.cancel = async (req, res) => {
  try {
    const a = await Appointment.findOne({
      _id: req.params.id, patient: req.user._id, bookingType: "queue", status: "confirmed",
    });
    if (!a) return res.status(404).json({ message: "Appointment not found or already completed/cancelled" });

    const doctor = await User.findById(a.doctor).select("fees");
    const paid = a.amountPaid ?? doctor?.fees ?? 0;
    const pct = a.carriedOver ? 1 : PARTIAL_REFUND;
    const refund = Math.round(paid * pct * 100) / 100;

    let refundId = null;
    if (refund > 0 && a.razorpayPaymentId) refundId = await refundPayment(a.razorpayPaymentId, refund);

    a.status = "cancelled";
    a.cancelReason = a.carriedOver ? "Cancelled by patient (carried over, full refund)" : "Cancelled by patient";
    a.refundAmount = refund;
    a.paymentStatus = refund > 0 ? (refundId ? "refunded" : "refund_pending") : a.paymentStatus;
    if (refundId) a.razorpayRefundId = refundId;
    await a.save();

    res.json({
      message: refundId || refund === 0
        ? `Cancelled. ₹${refund} will be refunded to your original payment method.`
        : "Cancelled. Refund is pending, our team will process it shortly.",
      refundAmount: refund,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not cancel" });
  }
};

// GET /queue/:id/switch-options
exports.getSwitchOptions = async (req, res) => {
  try {
    const a = await Appointment.findOne({
      _id: req.params.id, patient: req.user._id, bookingType: "queue", status: "confirmed",
    }).populate("doctor", "specialization fees");
    if (!a) return res.status(404).json({ message: "Appointment not found" });

    const settings = await Q.loadSettings();
    const paid = a.amountPaid ?? a.doctor.fees ?? 0;
    const doctors = await User.find({
      role: "doctor", bookingType: "queue", specialization: a.doctor.specialization,
      _id: { $ne: a.doctor._id }, fees: { $lte: paid },
    }).select(DOC_FIELDS);

    const out = [];
    for (const d of doctors) {
      if (!Q.isOpen(settings, d)) continue;
      const qd = Q.queueDateFor(settings, d);
      if (qd !== a.queueDate) continue; // sirf usi din ki queue wale doctors
      if ((await countFor(d._id, qd)) >= DAILY_MAX) continue;
      const queue = await loadQueue(d._id, qd);
      out.push({
        _id: d._id, name: d.name, fees: d.fees, experience: d.experience, avgRating: d.avgRating,
        shiftType: Q.shiftOf(d),
        refundOnSwitch: Math.max(0, paid - (d.fees || 0)),
        ...placeAt(queue.length, settings, d),
      });
    }
    out.sort((x, y) => (x.queueStatus === y.queueStatus ? 0 : x.queueStatus === "confirmed" ? -1 : 1));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load doctors" });
  }
};

// POST /queue/:id/switch  { newDoctorId }
exports.switchDoctor = async (req, res) => {
  try {
    const a = await Appointment.findOne({
      _id: req.params.id, patient: req.user._id, bookingType: "queue", status: "confirmed",
    }).populate("doctor", "specialization fees");
    if (!a) return res.status(404).json({ message: "Appointment not found" });

    const nd = await User.findOne({
      _id: req.body.newDoctorId, role: "doctor", bookingType: "queue", specialization: a.doctor.specialization,
    });
    if (!nd || String(nd._id) === String(a.doctor._id)) return res.status(400).json({ message: "Invalid doctor" });

    const settings = await Q.loadSettings();
    if (!Q.isOpen(settings, nd)) return res.status(400).json({ message: "This doctor is not taking bookings now" });
    const qd = Q.queueDateFor(settings, nd);
    if (qd !== a.queueDate) return res.status(400).json({ message: "Doctor can be changed only within the same day's queue" });

    const paid = a.amountPaid ?? a.doctor.fees ?? 0;
    if ((nd.fees || 0) > paid) return res.status(400).json({ message: "Selected doctor's fee is higher than what you paid" });
    if ((await countFor(nd._id, qd)) >= DAILY_MAX) return res.status(409).json({ message: "This doctor is fully booked" });

    const diff = Math.round((paid - (nd.fees || 0)) * 100) / 100;
    let refundId = null;
    if (diff > 0 && a.razorpayPaymentId) refundId = await refundPayment(a.razorpayPaymentId, diff);

    a.doctor = nd._id;
    a.seq = await nextSeq(nd._id, qd);
    a.priorityDate = qd;
    a.timeSlot = `Token #${a.seq}`;
    a.amountPaid = nd.fees || 0;
    if (diff > 0) a.refundAmount = (a.refundAmount || 0) + diff;
    if (refundId) a.razorpayRefundId = refundId;
    await a.save();

    const queue = await loadQueue(nd._id, qd);
    const idx = queue.findIndex((q) => String(q._id) === String(a._id));
    res.json({
      message: diff > 0 ? `Doctor changed. ₹${diff} fee difference will be refunded.` : "Doctor changed.",
      ...placeAt(idx, settings, nd),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not change doctor" });
  }
};

// GET /queue/doctor-summary
exports.getDoctorSummary = async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id).select("bookingType shiftType avgConsultationTime");
    if (doctor?.bookingType !== "queue") return res.json({ applicable: false });

    const settings = await Q.loadSettings();
    const qd = Q.queueDateFor(settings, doctor);
    const [queue, completed] = await Promise.all([
      loadQueue(doctor._id, qd).populate("patient", "name"),
      Appointment.countDocuments({ doctor: doctor._id, bookingType: "queue", queueDate: qd, status: "completed" }),
    ]);

    const remaining = queue.length;
    res.json({
      applicable: true,
      queueDate: qd,
      total: completed + remaining,
      confirmed: Math.min(CONFIRMED_LIMIT, remaining),
      waiting: Math.max(0, remaining - CONFIRMED_LIMIT),
      completed,
      remaining,
      carriedOver: queue.filter((q) => q.carriedOver).length,
      list: queue.map((q, i) => ({
        _id: q._id, bookingNo: q.seq, carriedOver: q.carriedOver,
        patient: q.patient?.name, ...placeAt(i, settings, doctor),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load summary" });
  }
};