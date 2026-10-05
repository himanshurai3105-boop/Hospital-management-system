const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const User = require("../models/User");
const Report = require("../models/Report");
const Medicine = require("../models/Medicine");
const Appointment = require("../models/Appointment");
const PharmacyDispense = require("../models/PharmacyDispense");

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fail = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const sendError = (res, error, fallback) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: fallback });
};

// Sirf pharmacist (bed coordinator ya baaki staff nahi)
const ensurePharmacist = (req) => {
  if (req.user?.role !== "staff" || req.user?.staffType !== "pharmacist") {
    throw fail(403, "Only the pharmacist can use the pharmacy counter");
  }
};

const razorpay = () =>
  new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

const tryRefund = async (paymentId) => {
  try {
    const r = await razorpay().payments.refund(paymentId, {});
    return r.id;
  } catch (e) {
    console.error("Refund failed:", e?.error?.description || e?.message || e);
    return null;
  }
};

// Transaction: ya to sab ho, ya kuch bhi nahi (Atlas par chalta hai)
const runInTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(() => fn(session));
  } finally {
    await session.endSession();
  }
};

// Client se sirf reportId + itemId lete hain. Medicine, quantity, price sab DB se
const resolveItems = async (patientId, items) => {
  const seen = new Set();
  const wanted = [];
  for (const it of items) {
    if (!mongoose.isValidObjectId(it?.reportId) || !mongoose.isValidObjectId(it?.itemId)) {
      throw fail(400, "Invalid medicine entry");
    }
    if (seen.has(String(it.itemId))) throw fail(400, "Same medicine selected twice");
    seen.add(String(it.itemId));
    wanted.push({ reportId: String(it.reportId), itemId: String(it.itemId) });
  }

  const reports = await Report.find({
    _id: { $in: [...new Set(wanted.map((w) => w.reportId))] },
    patient: patientId,
  }).select("prescribedMedicines");
  const reportMap = Object.fromEntries(reports.map((r) => [String(r._id), r]));

  const rows = wanted.map((w) => {
    const item = reportMap[w.reportId]?.prescribedMedicines.id(w.itemId);
    if (!item) throw fail(404, "Prescribed medicine not found for this patient");
    if (item.status !== "pending") throw fail(409, "A selected medicine was already dispensed");
    return { ...w, medicine: item.medicine, quantity: item.quantity };
  });

  const meds = await Medicine.find({ _id: { $in: rows.map((r) => r.medicine) } }).select("name price stock");
  const medMap = Object.fromEntries(meds.map((m) => [String(m._id), m]));

  return rows.map((r) => {
    const m = medMap[String(r.medicine)];
    if (!m) throw fail(404, "Medicine not found");
    if (m.stock < r.quantity) throw fail(400, `Insufficient stock for ${m.name}`);
    return { ...r, name: m.name, price: m.price };
  });
};

// Item ko "dispensed" karo aur stock ghatao, dono atomic. Pehle se dispense ho chuka ho to error
const claimItem = async ({ report, itemMatch, medicine, quantity, name }, dispenseId, pharmacistId, patientId, session) => {
  if (report) {
    const r = await Report.updateOne(
      { _id: report, patient: patientId, prescribedMedicines: { $elemMatch: { ...itemMatch, status: "pending" } } },
      {
        $set: {
          "prescribedMedicines.$.status": "dispensed",
          "prescribedMedicines.$.dispensedBy": pharmacistId,
          "prescribedMedicines.$.dispensedAt": new Date(),
          "prescribedMedicines.$.dispense": dispenseId,
        },
        $inc: { __v: 1 }, // doctor ka edit ek saath ho raha ho to usko conflict mile
      },
      { session }
    );
    if (r.modifiedCount !== 1) throw fail(409, `${name || "A medicine"} was already dispensed`, { refund: true });
  }
  const m = await Medicine.updateOne({ _id: medicine, stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { session });
  if (m.modifiedCount !== 1) throw fail(400, `Insufficient stock for ${name || "a medicine"}`, { refund: true });
};

// @route GET /api/pharmacy/patients/search?q=
// Patient ke naam / Hospital ID / phone se, ya doctor ke naam / ID se (us doctor ke jin patients ki medicine pending hai)
exports.searchPatient = async (req, res) => {
  try {
    ensurePharmacist(req);
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json([]);
    const rx = new RegExp(esc(q), "i");
    const fields = "name hospitalId phone";

    const direct = await User.find({
      role: "patient",
      $or: [{ name: rx }, { hospitalId: rx }, { phone: rx }],
    })
      .select(fields)
      .limit(10)
      .lean();

    let viaDoctor = [];
    const doctors = await User.find({ role: "doctor", $or: [{ name: rx }, { hospitalId: rx }] })
      .select("_id")
      .limit(20)
      .lean();
    if (doctors.length) {
      const patientIds = await Report.distinct("patient", {
        doctor: { $in: doctors.map((d) => d._id) },
        prescribedMedicines: { $elemMatch: { status: "pending" } },
      });
      if (patientIds.length) {
        viaDoctor = await User.find({ _id: { $in: patientIds.slice(0, 10) }, role: "patient" })
          .select(fields)
          .lean();
      }
    }

    const merged = new Map();
    for (const p of [...direct, ...viaDoctor]) merged.set(String(p._id), p);
    res.json([...merged.values()].slice(0, 10));
  } catch (error) {
    sendError(res, error, "Search failed");
  }
};

// @route GET /api/pharmacy/patients/:patientId/pending-medicines
// Sirf medicines. Diagnosis pharmacist ko nahi jaata
exports.getPendingMedicines = async (req, res) => {
  try {
    ensurePharmacist(req);
    if (!mongoose.isValidObjectId(req.params.patientId)) throw fail(400, "Invalid patient");

    const reports = await Report.find({
      patient: req.params.patientId,
      prescribedMedicines: { $elemMatch: { status: "pending" } },
    })
      .populate("doctor", "name specialization")
      .populate("prescribedMedicines.medicine", "name price stock")
      .select("doctor prescribedMedicines createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const pendingItems = [];
    for (const report of reports) {
      for (const item of report.prescribedMedicines) {
        if (item.status === "pending") {
          pendingItems.push({
            reportId: report._id,
            itemId: item._id,
            medicine: item.medicine,
            quantity: item.quantity,
            doctor: report.doctor,
            prescribedDate: report.createdAt,
          });
        }
      }
    }
    res.json(pendingItems);
  } catch (error) {
    sendError(res, error, "Could not load medicines");
  }
};

// @route POST /api/pharmacy/dispense
// items: [{ reportId, itemId }]  (baaki sab server DB se leta hai)
exports.dispenseMedicines = async (req, res) => {
  try {
    ensurePharmacist(req);
    const { patientId, items, paymentMethod } = req.body;

    if (!mongoose.isValidObjectId(patientId)) throw fail(400, "Invalid patient");
    if (!["cash", "online"].includes(paymentMethod)) throw fail(400, "Invalid payment method");
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      throw fail(400, "Select at least one medicine to dispense");
    }

    const resolved = await resolveItems(patientId, items);
    const totalAmount = Math.round(resolved.reduce((s, r) => s + r.price * r.quantity, 0) * 100) / 100;

    const data = {
      _id: new mongoose.Types.ObjectId(),
      patient: patientId,
      pharmacist: req.user._id,
      items: resolved.map((r) => ({
        report: r.reportId,
        medicine: r.medicine,
        quantity: r.quantity,
        priceAtDispense: r.price,
      })),
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "paid" : "unpaid",
    };

    if (paymentMethod === "cash") {
      await runInTransaction(async (session) => {
        for (const r of resolved) {
          await claimItem(
            { report: r.reportId, itemMatch: { _id: r.itemId }, medicine: r.medicine, quantity: r.quantity, name: r.name },
            data._id, req.user._id, patientId, session
          );
        }
        await PharmacyDispense.create([data], { session });
      });
      return res.status(201).json(await PharmacyDispense.findById(data._id));
    }

    // online: bill banta hai (unpaid), items payment verify hone par dispense hote hain
    const dispense = await PharmacyDispense.create(data);
    res.status(201).json(dispense);
  } catch (error) {
    sendError(res, error, "Could not dispense medicines");
  }
};

// @route POST /api/pharmacy/dispense/:id/verify-payment
exports.verifyDispensePayment = async (req, res) => {
  let paymentId = null;
  try {
    ensurePharmacist(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((v) => typeof v === "string" && v)) {
      throw fail(400, "Missing payment details");
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw fail(400, "Invalid payment signature");

    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid record");
    const dispense = await PharmacyDispense.findById(req.params.id);
    if (!dispense) throw fail(404, "Dispense record not found");
    if (dispense.paymentMethod !== "online") throw fail(400, "This record is not an online payment");
    if (dispense.paymentStatus === "paid") throw fail(409, "This bill is already paid and finalized");

    // Ye payment kisi aur bill / appointment ki to nahi
    const used =
      (await PharmacyDispense.exists({ razorpayOrderId: razorpay_order_id })) ||
      (await Appointment.exists({ razorpayOrderId: razorpay_order_id }));
    if (used) throw fail(409, "This payment was already used");

    // Razorpay se confirm: payment isi order ki hai aur amount isi bill ka hai
    const p = await razorpay().payments.fetch(razorpay_payment_id);
    const paidOk = ["captured", "authorized"].includes(p.status) && p.order_id === razorpay_order_id;
    if (!paidOk) throw fail(400, "Payment is not completed");
    paymentId = razorpay_payment_id; // yahan se payment asli maani jaati hai, galti par refund hoga
    if (p.amount !== Math.round(dispense.totalAmount * 100)) {
      throw fail(400, "Paid amount does not match the bill", { refund: true });
    }

    let finalized = null;
    await runInTransaction(async (session) => {
      finalized = await PharmacyDispense.findOneAndUpdate(
        { _id: dispense._id, paymentStatus: "unpaid" },
        { $set: { paymentStatus: "paid", razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id } },
        { new: true, session }
      );
      if (!finalized) throw fail(409, "This bill is already finalized");

      for (const item of dispense.items) {
        await claimItem(
          {
            report: item.report,
            itemMatch: { medicine: item.medicine },
            medicine: item.medicine,
            quantity: item.quantity,
          },
          dispense._id, dispense.pharmacist, dispense.patient, session
        );
      }
    });

    res.json({ message: "Payment verified and medicines dispensed", dispense: finalized });
  } catch (error) {
    if (error.refund && paymentId) {
      const rid = await tryRefund(paymentId);
      return res.status(error.status || 400).json({
        message: `${error.message}. ${
          rid ? "The payment will be refunded." : `Auto-refund failed, contact admin (Payment ID: ${paymentId}).`
        }`,
      });
    }
    sendError(res, error, "Could not verify payment");
  }
};

// @route GET /api/pharmacy/my-history   (patient)
exports.getMyDispenseHistory = async (req, res) => {
  try {
    const history = await PharmacyDispense.find({ patient: req.user._id })
      .populate("pharmacist", "name")
      .populate("items.medicine", "name price")
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    sendError(res, error, "Could not load history");
  }
};

// @route GET /api/pharmacy/patient/:patientId/history   (doctor / admin)
exports.getPatientDispenseHistory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.patientId)) throw fail(400, "Invalid patient");
    const history = await PharmacyDispense.find({ patient: req.params.patientId })
      .populate("pharmacist", "name")
      .populate("items.medicine", "name price")
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    sendError(res, error, "Could not load history");
  }
};

// @route GET /api/pharmacy/all   (admin)
exports.getAllDispenses = async (req, res) => {
  try {
    const history = await PharmacyDispense.find()
      .populate("patient", "name hospitalId")
      .populate("pharmacist", "name")
      .populate("items.medicine", "name price")
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(history);
  } catch (error) {
    sendError(res, error, "Could not load records");
  }
};