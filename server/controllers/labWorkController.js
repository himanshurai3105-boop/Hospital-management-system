const crypto = require("crypto");
const mongoose = require("mongoose");
const LabOrder = require("../models/LabOrder");
const LabTest = require("../models/LabTest");
const Appointment = require("../models/Appointment");
const S = require("../utils/slotTime");
const { streamLabPdf } = require("../utils/labPdf");

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
const fail = (status, message) => Object.assign(new Error(message), { status });
const sendError = (res, error, fallback) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: fallback });
};
const validId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw fail(400, "Invalid id");
};
const techCategory = (req) => {
  const c = req.user.labSpecialization;
  if (!c) throw fail(403, "Your lab specialization is not set. Please contact the admin.");
  return c;
};

// ---------- result banane ka logic ----------
// number wali range: low/high; text wali: match na hua to abnormal; kuch nahi: ""; number nahi mila: null
const flagFor = (p, value) => {
  const v = String(value).trim();
  if (p.refMin != null || p.refMax != null) {
    const n = Number(v);
    if (v === "" || !Number.isFinite(n)) return null;
    if (p.refMin != null && n < p.refMin) return "low";
    if (p.refMax != null && n > p.refMax) return "high";
    return "normal";
  }
  if (p.refText) return v.toLowerCase() === String(p.refText).toLowerCase() ? "normal" : "abnormal";
  return "";
};

// Test ke parameters se hi values banti hain (ranges ka snapshot result mein jaata hai)
const buildResult = (test, body) => {
  const input = Array.isArray(body.values) ? body.values : [];
  const byName = new Map(input.map((v) => [String(v?.name), v?.value]));
  const params = test?.parameters || [];
  const values = [];

  for (const p of params) {
    const raw = byName.get(p.name);
    if (raw == null || String(raw).trim() === "") continue; // khali chhodi gayi value skip
    const value = String(raw).trim().slice(0, 100);
    const flag = flagFor(p, value);
    if (flag === null) throw fail(400, `${p.name} must be a number`);
    const entry = { name: p.name, value, unit: p.unit || "", flag };
    if (p.refMin != null) entry.refMin = p.refMin;
    if (p.refMax != null) entry.refMax = p.refMax;
    if (p.refText) entry.refText = p.refText;
    values.push(entry);
  }

  const remarks = String(body.remarks || "").trim().slice(0, 2000);
  if (params.length && values.length === 0) throw fail(400, "Enter at least one result value");
  if (!params.length && !remarks) throw fail(400, "Write the report text");
  return { values, remarks };
};

// ---------- kaun dekh sakta hai ----------
const doctorTreats = async (doctorId, patientId) =>
  !!(await Appointment.exists({ doctor: doctorId, patient: patientId, status: { $ne: "cancelled" } })) ||
  !!(await LabOrder.exists({ doctor: doctorId, patient: patientId }));

const canView = async (user, order) => {
  const patientId = String(order.patient?._id || order.patient);
  const doctorId = String(order.doctor?._id || order.doctor);
  if (user.role === "admin") return true;
  if (user.role === "patient") return patientId === String(user._id);
  if (user.role === "doctor") return doctorId === String(user._id) || (await doctorTreats(user._id, patientId));
  if (user.role === "staff" && user.staffType === "lab_technician") {
    return !!user.labSpecialization && user.labSpecialization === order.category;
  }
  return false; // pharmacist aur baaki staff: nahi
};

const shape = (o, isAdmin) => {
  const am = o.result?.amendments || [];
  const out = {
    _id: o._id, testName: o.testName, category: o.category, priority: o.priority,
    status: o.status, sampleId: o.sampleId, createdAt: o.createdAt, doctor: o.doctor,
  };
  if (o.status === "completed") {
    out.result = { values: o.result.values || [], remarks: o.result.remarks, submittedAt: o.result.submittedAt };
    out.amendmentCount = am.length;
    out.lastAmendedAt = am.length ? am[am.length - 1].at : null;
    if (isAdmin) out.amendments = am.map((a) => ({ at: a.at, reason: a.reason, by: a.by?.name }));
  }
  return out;
};

const listFor = async (filter, isAdmin) => {
  let q = LabOrder.find({ ...filter, status: { $ne: "cancelled" } })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("doctor", "name specialization");
  if (isAdmin) q = q.populate("result.amendments.by", "name");
  const orders = await q.lean();
  return orders.map((o) => shape(o, isAdmin));
};

// ================= Lab technician =================

// GET /api/lab/queue?view=pending|done&q=&from=&to=&page=
exports.getQueue = async (req, res) => {
  try {
    const category = techCategory(req);
    const q = String(req.query.q || "").trim();
    const done = req.query.view === "done";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 20;

    const match = { category, status: done ? "completed" : { $in: ["ordered", "sample_collected"] } };
    const range = {};
    if (isDate(req.query.from)) range.$gte = S.dayRange(req.query.from).start;
    if (isDate(req.query.to)) range.$lt = S.dayRange(req.query.to).end;
    if (Object.keys(range).length) match[done ? "result.submittedAt" : "createdAt"] = range;

    const users = require("../models/User").collection.name;
    const pipeline = [
      { $match: match },
      { $lookup: { from: users, localField: "patient", foreignField: "_id", as: "p" } },
      { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: users, localField: "doctor", foreignField: "_id", as: "d" } },
      { $unwind: { path: "$d", preserveNullAndEmptyArrays: true } },
    ];
    if (q) {
      const rx = new RegExp(esc(q), "i");
      pipeline.push({
        $match: {
          $or: [
            { "p.name": rx }, { "p.hospitalId": rx }, { "d.name": rx }, { "d.hospitalId": rx },
            { testName: rx }, { sampleId: rx },
          ],
        },
      });
    }
    pipeline.push(
      { $sort: done ? { "result.submittedAt": -1 } : { priority: -1, createdAt: 1 } }, // urgent pehle, phir purana pehle
      {
        $project: {
          testName: 1, priority: 1, instructions: 1, status: 1, sampleId: 1, createdAt: 1,
          submittedAt: "$result.submittedAt",
          patient: { name: "$p.name", hospitalId: "$p.hospitalId", age: "$p.age", gender: "$p.gender" },
          doctor: { name: "$d.name", hospitalId: "$d.hospitalId" },
        },
      },
      { $facet: { data: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: "n" }] } }
    );

    const [out] = await LabOrder.aggregate(pipeline);
    const total = out.total[0]?.n || 0;
    res.json({ orders: out.data, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    sendError(res, error, "Could not load lab queue");
  }
};

// GET /api/lab/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const category = techCategory(req);
    validId(req.params.id);
    const order = await LabOrder.findOne({ _id: req.params.id, category, status: { $ne: "cancelled" } })
      .populate("patient", "name hospitalId age gender")
      .populate("doctor", "name")
      .lean();
    if (!order) throw fail(404, "Order not found");
    const test = await LabTest.findById(order.test).select("parameters").lean();
    res.json({ ...order, parameters: test?.parameters || [] });
  } catch (error) {
    sendError(res, error, "Could not load order");
  }
};

// PUT /api/lab/orders/:id/collect-sample
exports.collectSample = async (req, res) => {
  try {
    const category = techCategory(req);
    validId(req.params.id);
    const sampleId = `S-${S.getTodayStr().replace(/-/g, "")}-${crypto.randomInt(1000, 10000)}`;
    const order = await LabOrder.findOneAndUpdate(
      { _id: req.params.id, category, status: "ordered" },
      { $set: { status: "sample_collected", sampleId, sampleCollectedAt: new Date(), sampleCollectedBy: req.user._id } },
      { new: true }
    );
    if (!order) throw fail(409, "This order is not waiting for a sample (already updated or cancelled)");
    res.json({ message: "Sample collected", sampleId: order.sampleId });
  } catch (error) {
    sendError(res, error, "Could not update order");
  }
};

// POST /api/lab/orders/:id/result   { values: [{name, value}], remarks }
exports.submitResult = async (req, res) => {
  try {
    const category = techCategory(req);
    validId(req.params.id);
    const order = await LabOrder.findOne({ _id: req.params.id, category }).lean();
    if (!order || order.status === "cancelled") throw fail(404, "Order not found");
    if (order.status === "completed") throw fail(409, "Result already submitted. Use Amend to change it.");

    const test = await LabTest.findById(order.test).lean();
    const { values, remarks } = buildResult(test, req.body);

    const updated = await LabOrder.findOneAndUpdate(
      { _id: order._id, category, status: { $in: ["ordered", "sample_collected"] } },
      {
        $set: {
          status: "completed",
          "result.values": values,
          "result.remarks": remarks,
          "result.submittedBy": req.user._id,
          "result.submittedAt": new Date(),
        },
      },
      { new: true }
    );
    if (!updated) throw fail(409, "Result was just submitted by someone else");
    res.json({ message: "Result submitted" });
  } catch (error) {
    sendError(res, error, "Could not submit result");
  }
};

// PUT /api/lab/orders/:id/result   { values, remarks, reason }  (submit ke baad badlav, purani value history mein jaati hai)
exports.amendResult = async (req, res) => {
  try {
    const category = techCategory(req);
    validId(req.params.id);
    const reason = String(req.body.reason || "").trim();
    if (reason.length < 5) throw fail(400, "Please write the reason for the change (at least 5 characters)");

    const order = await LabOrder.findOne({ _id: req.params.id, category, status: "completed" }).lean();
    if (!order) throw fail(404, "Completed order not found");

    const test = await LabTest.findById(order.test).lean();
    const { values, remarks } = buildResult(test, req.body);

    const amendment = {
      at: new Date(),
      by: req.user._id,
      reason: reason.slice(0, 300),
      previousValues: order.result?.values || [],
      previousRemarks: order.result?.remarks,
    };
    const updated = await LabOrder.findOneAndUpdate(
      { _id: order._id, category, status: "completed" },
      { $set: { "result.values": values, "result.remarks": remarks }, $push: { "result.amendments": amendment } },
      { new: true }
    );
    if (!updated) throw fail(409, "Could not amend this result");
    res.json({ message: "Result amended" });
  } catch (error) {
    sendError(res, error, "Could not amend result");
  }
};

// ================= Patient / Doctor / Admin =================

// GET /api/lab/my/results
exports.getMyResults = async (req, res) => {
  try {
    res.json(await listFor({ patient: req.user._id }, false));
  } catch (error) {
    sendError(res, error, "Could not load lab results");
  }
};

// GET /api/lab/patient/:patientId/results   (doctor sirf apne patient ka, admin sabka)
exports.getPatientResults = async (req, res) => {
  try {
    validId(req.params.patientId);
    if (req.user.role === "doctor" && !(await doctorTreats(req.user._id, req.params.patientId))) {
      throw fail(403, "You can view lab results only for your own patients");
    }
    res.json(await listFor({ patient: req.params.patientId }, req.user.role === "admin"));
  } catch (error) {
    sendError(res, error, "Could not load lab results");
  }
};

// GET /api/lab/orders/:id/pdf
exports.getPdf = async (req, res) => {
  try {
    validId(req.params.id);
    const order = await LabOrder.findById(req.params.id)
      .populate("patient", "name hospitalId age gender")
      .populate("doctor", "name specialization")
      .populate("result.submittedBy", "name labSpecialization")
      .lean();

    // Na mila aur dekhne ki ijazat nahi, dono ke liye same jawab
    if (!order || order.status !== "completed" || !(await canView(req.user, order))) {
      throw fail(404, "Report not found");
    }
    streamLabPdf(res, order);
  } catch (error) {
    if (res.headersSent) return res.end();
    sendError(res, error, "Could not generate the report");
  }
};