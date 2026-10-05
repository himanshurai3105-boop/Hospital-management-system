const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const User = require("../models/User"); // agar doctor model ka path/naam alag hai to badal do
const S = require("../utils/slotTime");

const ACTIVE = { $nin: ["cancelled"] };

// { "doctorId|YYYY-MM-DD": [startMinutes] }
const loadBooked = async (doctorIds, fromStr, toStr) => {
  const appts = await Appointment.find({
    doctor: { $in: doctorIds },
    date: { $gte: S.dayRange(fromStr).start, $lt: S.dayRange(toStr).end },
    status: ACTIVE,
  }).select("doctor date timeSlot");

  const map = {};
  for (const a of appts) {
    const dateStr = a.date.toLocaleDateString("en-CA", { timeZone: S.TZ });
    const start = S.parseStartMinutes(a.timeSlot);
    if (start === null) continue;
    const key = `${a.doctor}|${dateStr}`;
    (map[key] = map[key] || []).push(start);
  }
  return map;
};

const countFree = (day) => day.filter((s) => s.available).length;

const getScheduledDoctor = async (doctorId) => {
  const doc = await User.findOne({ _id: doctorId, role: "doctor", bookingType: "scheduled" });
  return doc;
};

// ---------- GET /scheduled/overview/:doctorId ----------
exports.getOverview = async (req, res) => {
  try {
    const doctor = await getScheduledDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const today = S.getTodayStr();
    const last = S.addDays(today, S.WINDOW_DAYS - 1);
    const booked = await loadBooked([doctor._id], today, last);

    const result = [];
    for (let i = 0; i < S.WINDOW_DAYS; i++) {
      const date = S.addDays(today, i);
      const day = S.buildDay(date, booked[`${doctor._id}|${date}`] || []);
      result.push({ date, availableSlots: countFree(day) });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load calendar" });
  }
};

// ---------- GET /scheduled/availability/:doctorId?date= ----------
exports.getAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!S.isDateInWindow(date)) return res.status(400).json({ message: "Invalid date" });

    const doctor = await getScheduledDoctor(req.params.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const booked = await loadBooked([doctor._id], date, date);
    res.json({ slots: S.buildDay(date, booked[`${doctor._id}|${date}`] || []) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load slots" });
  }
};

// ---------- GET /scheduled/free-doctors?specialization=&date=&exclude= ----------
exports.getFreeDoctors = async (req, res) => {
  try {
    const { specialization, date, exclude } = req.query;
    if (!specialization || !S.isDateInWindow(date)) {
      return res.status(400).json({ message: "specialization and valid date required" });
    }
    const filter = { role: "doctor", bookingType: "scheduled", specialization };
    if (exclude) filter._id = { $ne: exclude };

    const doctors = await User.find(filter)
      .select("name specialization fees experience avgRating totalReviews bookingType");
    const booked = await loadBooked(doctors.map((d) => d._id), date, date);

    const result = doctors
      .map((d) => {
        const free = countFree(S.buildDay(date, booked[`${d._id}|${date}`] || []));
        return { ...d.toObject(), availableSlots: free };
      })
      .filter((d) => d.availableSlots > 0)
      .sort((a, b) => b.availableSlots - a.availableSlots);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load doctors" });
  }
};

// ---------- common validation (precheck + book dono use karte hain) ----------
const validateBooking = async ({ patientId, doctorId, date, timeSlot }) => {
  if (!S.isDateInWindow(date)) return { status: 400, message: "Invalid date" };
  if (!S.generateSlots().includes(timeSlot)) return { status: 400, message: "Invalid time slot" };
  if (!S.isSlotBookable(date, timeSlot)) {
    return { status: 400, message: "This slot is no longer available. Please pick a later time." };
  }

  const doctor = await getScheduledDoctor(doctorId);
  if (!doctor) return { status: 404, message: "Doctor not found" };

  // Ek patient, ek din, ek hi appointment
  const { start, end } = S.dayRange(date);
  const already = await Appointment.findOne({
    patient: patientId, date: { $gte: start, $lt: end }, status: ACTIVE,
  });
  if (already) {
    return { status: 409, message: "You already have an appointment on this date. Only one appointment per day is allowed." };
  }

  const booked = await loadBooked([doctor._id], date, date);
  const slotStart = S.parseStartMinutes(timeSlot);
  if (S.isBlocked(slotStart, booked[`${doctor._id}|${date}`] || [])) {
    return { status: 409, message: "This slot was just booked by someone else. Please pick another." };
  }
  return { doctor };
};

// ---------- POST /scheduled/precheck  (payment se PEHLE) ----------
exports.precheck = async (req, res) => {
  try {
    const { doctorId, date, timeSlot } = req.body;
    const v = await validateBooking({ patientId: req.user._id, doctorId, date, timeSlot });
    if (v.message) return res.status(v.status).json({ message: v.message });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not verify slot" });
  }
};

const tryRefund = async (paymentId) => {
  try {
    const Razorpay = require("razorpay");
    const rz = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const r = await rz.payments.refund(paymentId, { speed: "normal" });
    return r.id;
  } catch (e) {
    console.error("Auto refund failed:", e?.message || e);
    return null;
  }
};

// ---------- POST /scheduled/book-with-payment ----------
exports.bookWithPayment = async (req, res) => {
  try {
    const {
      doctorId, date, timeSlot, reason,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
    } = req.body;

    // 1. Payment signature verify
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // 2. Slot + one-per-day + double booking check
    const v = await validateBooking({ patientId: req.user._id, doctorId, date, timeSlot });
    if (v.message) {
      const refundId = await tryRefund(razorpay_payment_id);
      return res.status(v.status).json({
        message: `${v.message} ${refundId ? "Your payment will be refunded." : `Payment could not be auto-refunded, contact support (Payment ID: ${razorpay_payment_id}).`}`,
      });
    }

    // 3. Save (unique index race condition se bachata hai)
    try {
      const appt = await Appointment.create({
        patient: req.user._id,
        doctor: v.doctor._id,
        date: S.toDbDate(date),
        timeSlot,
        reason: reason ? String(reason).slice(0, 500) : undefined,
        status: "confirmed",
        bookingType: "scheduled",
        paymentStatus: "paid",
        paymentMethod: "online",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
      return res.status(201).json(appt);
    } catch (e) {
      if (e.code === 11000) {
        const refundId = await tryRefund(razorpay_payment_id);
        return res.status(409).json({
          message: `This slot was just booked by someone else. ${refundId ? "Your payment will be refunded." : `Contact support (Payment ID: ${razorpay_payment_id}).`}`,
        });
      }
      throw e;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Booking failed. Contact support if money was deducted." });
  }
};