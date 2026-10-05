const mongoose = require("mongoose");
const Report = require("../models/Report");
const Appointment = require("../models/Appointment");
const Medicine = require("../models/Medicine");
const LabTest = require("../models/LabTest");
const LabOrder = require("../models/LabOrder");
const S = require("../utils/slotTime");

const MAX_MEDICINES = 20;
const MAX_LAB_TESTS = 10;
const MAX_QTY = 100;

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fail = (status, message) => Object.assign(new Error(message), { status });
const sendError = (res, error, fallback) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  if (error.name === "VersionError") {
    return res.status(409).json({
      message: "This report was just updated (for example a medicine was dispensed). Please reload and try again.",
    });
  }
  console.error(error);
  return res.status(500).json({ message: fallback });
};

const validQty = (v) => {
  const qty = Number(v);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    throw fail(400, `Quantity must be a whole number between 1 and ${MAX_QTY}`);
  }
  return qty;
};

// Sirf medicine + quantity lo. status/dispensedBy jaise fields body se kabhi nahi
const cleanMedicines = async (items) => {
  if (items == null) return [];
  if (!Array.isArray(items) || items.length > MAX_MEDICINES) {
    throw fail(400, `Up to ${MAX_MEDICINES} medicines allowed`);
  }
  const seen = new Set();
  const out = [];
  for (const it of items) {
    if (!mongoose.isValidObjectId(it?.medicine)) throw fail(400, "Invalid medicine selected");
    const qty = validQty(it.quantity);
    if (seen.has(String(it.medicine))) throw fail(400, "Same medicine added twice");
    seen.add(String(it.medicine));
    out.push({ medicine: it.medicine, quantity: qty });
  }
  if (out.length) {
    const found = await Medicine.countDocuments({ _id: { $in: out.map((m) => m.medicine) } });
    if (found !== out.length) throw fail(400, "One or more medicines were not found");
  }
  return out;
};

// keepIds: report mein pehle se order ho chuke tests (admin ne baad mein deactivate kiya ho to bhi chalenge)
const cleanLabTests = async (items, keepIds = []) => {
  if (items == null) return [];
  if (!Array.isArray(items) || items.length > MAX_LAB_TESTS) {
    throw fail(400, `Up to ${MAX_LAB_TESTS} lab tests allowed`);
  }
  const seen = new Set();
  const picked = [];
  for (const it of items) {
    if (!mongoose.isValidObjectId(it?.testId)) throw fail(400, "Invalid lab test selected");
    if (seen.has(String(it.testId))) throw fail(400, "Same lab test added twice");
    seen.add(String(it.testId));
    picked.push({
      testId: it.testId,
      priority: it.priority === "urgent" ? "urgent" : "routine",
      instructions: it.instructions ? String(it.instructions).slice(0, 500) : undefined,
    });
  }
  if (!picked.length) return [];
  const tests = await LabTest.find({
    _id: { $in: picked.map((p) => p.testId) },
    $or: [{ isActive: true }, { _id: { $in: keepIds } }],
  });
  if (tests.length !== picked.length) throw fail(400, "One or more lab tests are unavailable");
  const byId = Object.fromEntries(tests.map((t) => [String(t._id), t]));
  return picked.map((p) => ({ ...p, test: byId[String(p.testId)] }));
};

// Reports ke saath unke lab orders ka chhota summary jodta hai
const attachLabOrders = async (reports) => {
  const ids = reports.map((r) => r._id);
  const orders = await LabOrder.find({ report: { $in: ids } })
    .select("report testName category status priority")
    .lean();
  const byReport = {};
  for (const o of orders) (byReport[String(o.report)] = byReport[String(o.report)] || []).push(o);
  return reports.map((r) => ({ ...r, labOrders: byReport[String(r._id)] || [] }));
};

// Ek poori report, lab orders ke saath (edit form ke liye)
const loadFull = async (reportId, withRevisions = false) => {
  let q = Report.findById(reportId)
    .populate("patient", "name email hospitalId")
    .populate("prescribedMedicines.medicine", "name price");
  if (withRevisions) q = q.select("+revisions");
  const report = await q.lean();
  const labOrders = await LabOrder.find({ report: reportId })
    .select("test testName category status priority instructions")
    .lean();
  return { ...report, labOrders };
};

// GET /api/reports/doctor/medicines?q=   (doctor ke form ka medicine picker)
exports.searchMedicines = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = q ? { name: new RegExp(esc(q), "i") } : {};
    const medicines = await Medicine.find(filter).select("name price stock").sort({ name: 1 }).limit(20).lean();
    res.json(medicines);
  } catch (error) {
    sendError(res, error, "Could not load medicines");
  }
};

// POST /api/reports
exports.createReport = async (req, res) => {
  let report = null;
  try {
    const { appointmentId, diagnosis, prescription, notes, followUpDate } = req.body;

    if (!mongoose.isValidObjectId(appointmentId)) throw fail(400, "Invalid appointment");
    const dx = String(diagnosis || "").trim();
    if (!dx) throw fail(400, "Diagnosis is required");

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: req.user._id,
      status: { $ne: "cancelled" },
    });
    if (!appointment) throw fail(404, "Appointment not found, cancelled, or not yours");

    if (await Report.findOne({ appointment: appointment._id })) {
      throw fail(409, "A report already exists for this appointment. Edit that report instead.");
    }

    let followUp;
    if (followUpDate) {
      followUp = new Date(followUpDate);
      if (isNaN(followUp) || followUp < S.dayRange(S.getTodayStr()).start) {
        throw fail(400, "Follow-up date must be today or later");
      }
    }

    const medicines = await cleanMedicines(req.body.prescribedMedicines);
    const labTests = await cleanLabTests(req.body.labTests);

    report = await Report.create({
      patient: appointment.patient,
      doctor: req.user._id,
      appointment: appointment._id,
      diagnosis: dx.slice(0, 2000),
      prescription: prescription ? String(prescription).slice(0, 2000) : undefined,
      notes: notes ? String(notes).slice(0, 2000) : undefined,
      followUpDate: followUp,
      prescribedMedicines: medicines,
    });

    if (labTests.length) {
      try {
        await LabOrder.insertMany(
          labTests.map((t) => ({
            report: report._id,
            patient: appointment.patient,
            doctor: req.user._id,
            appointment: appointment._id,
            test: t.test._id,
            testName: t.test.name,
            category: t.test.category,
            priority: t.priority,
            instructions: t.instructions,
          }))
        );
      } catch (e) {
        await Report.deleteOne({ _id: report._id }); // adhuri report mat chhodo
        throw e;
      }
    }

    res.status(201).json({ ...report.toObject(), labOrderCount: labTests.length });
  } catch (error) {
    sendError(res, error, "Could not create report");
  }
};

// PUT /api/reports/:reportId
// Doctor apni hi report edit karta hai (dispensed medicine aur sample-le-liye-gaye tests lock rehte hain)
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    if (!mongoose.isValidObjectId(reportId)) throw fail(400, "Invalid report");

    const report = await Report.findOne({ _id: reportId, doctor: req.user._id }).select("+revisions");
    if (!report) throw fail(404, "Report not found or not yours");

    const body = req.body;
    const changes = [];

    const before = {
      diagnosis: report.diagnosis,
      prescription: report.prescription,
      notes: report.notes,
      followUpDate: report.followUpDate,
      medicines: report.prescribedMedicines.map((m) => ({
        medicine: m.medicine,
        quantity: m.quantity,
        status: m.status,
      })),
    };

    // ---------- text fields ----------
    if (body.diagnosis !== undefined) {
      const dx = String(body.diagnosis).trim().slice(0, 2000);
      if (!dx) throw fail(400, "Diagnosis is required");
      if (dx !== report.diagnosis) {
        report.diagnosis = dx;
        changes.push("diagnosis");
      }
    }
    for (const field of ["prescription", "notes"]) {
      if (body[field] !== undefined) {
        const v = String(body[field]).trim().slice(0, 2000) || undefined;
        if (v !== (report[field] || undefined)) {
          report[field] = v;
          changes.push(field);
        }
      }
    }
    if (body.followUpDate !== undefined) {
      if (!body.followUpDate) {
        if (report.followUpDate) {
          report.followUpDate = undefined;
          changes.push("follow-up date");
        }
      } else {
        const d = new Date(body.followUpDate);
        if (isNaN(d)) throw fail(400, "Invalid follow-up date");
        if (d.getTime() !== report.followUpDate?.getTime()) {
          if (d < S.dayRange(S.getTodayStr()).start) throw fail(400, "Follow-up date must be today or later");
          report.followUpDate = d;
          changes.push("follow-up date");
        }
      }
    }

    // ---------- medicines ----------
    const dispensedItems = report.prescribedMedicines.filter((m) => m.status === "dispensed");
    const pendingItems = report.prescribedMedicines.filter((m) => m.status !== "dispensed");
    const lockedMedicines = dispensedItems.length;

    if (body.prescribedMedicines !== undefined) {
      if (!Array.isArray(body.prescribedMedicines)) throw fail(400, "Invalid medicines list");

      const dispensedIds = new Set(dispensedItems.map((m) => String(m._id)));
      const pendingIds = new Set(pendingItems.map((m) => String(m._id)));
      const wanted = [];
      const seenMed = new Set();

      for (const it of body.prescribedMedicines) {
        if (it?._id && dispensedIds.has(String(it._id))) continue; // dispensed: lock
        if (it?._id && !pendingIds.has(String(it._id))) throw fail(400, "Unknown medicine entry");
        if (!mongoose.isValidObjectId(it?.medicine)) throw fail(400, "Invalid medicine selected");
        const qty = validQty(it.quantity);
        if (seenMed.has(String(it.medicine))) throw fail(400, "Same medicine added twice");
        seenMed.add(String(it.medicine));
        wanted.push({ _id: it._id, medicine: it.medicine, quantity: qty });
      }

      if (lockedMedicines + wanted.length > MAX_MEDICINES) {
        throw fail(400, `Up to ${MAX_MEDICINES} medicines allowed`);
      }
      if (wanted.length) {
        const found = await Medicine.countDocuments({ _id: { $in: wanted.map((w) => w.medicine) } });
        if (found !== wanted.length) throw fail(400, "One or more medicines were not found");
      }

      const sig = (arr) => arr.map((m) => `${m.medicine}:${m.quantity}`).sort().join("|");
      if (sig(pendingItems) !== sig(wanted)) {
        report.prescribedMedicines = [
          ...dispensedItems.map((m) => m.toObject()),
          ...wanted.map((w) => ({
            ...(w._id ? { _id: w._id } : {}),
            medicine: w.medicine,
            quantity: w.quantity,
            status: "pending",
          })),
        ];
        changes.push("medicines");
      }
    }

    // ---------- lab tests (pehle plan banao, report save hone ke baad lagao) ----------
    let labPlan = null;
    let lockedLabTests = 0;
    if (body.labTests !== undefined) {
      const orders = await LabOrder.find({ report: report._id, status: { $ne: "cancelled" } });
      const wanted = await cleanLabTests(body.labTests, orders.map((o) => o.test));
      const byTest = new Map(orders.map((o) => [String(o.test), o]));
      const wantedIds = new Set(wanted.map((w) => String(w.test._id)));

      const toCancel = orders.filter((o) => o.status === "ordered" && !wantedIds.has(String(o.test)));
      const toCreate = wanted.filter((w) => !byTest.has(String(w.test._id)));
      const toUpdate = wanted.filter((w) => {
        const o = byTest.get(String(w.test._id));
        return (
          o &&
          o.status === "ordered" &&
          (o.priority !== w.priority || (o.instructions || "") !== (w.instructions || ""))
        );
      });
      lockedLabTests = orders.filter((o) => o.status !== "ordered").length;

      if (orders.length - toCancel.length + toCreate.length > MAX_LAB_TESTS) {
        throw fail(400, `Up to ${MAX_LAB_TESTS} lab tests allowed`);
      }
      if (toCancel.length || toCreate.length || toUpdate.length) {
        labPlan = { toCancel, toCreate, toUpdate };
        changes.push("lab tests");
      }
    }

    if (!changes.length) {
      return res.json({ message: "No changes", ...(await loadFull(report._id)), lockedMedicines, lockedLabTests, changes });
    }

    // ---------- save ----------
    report.revisions.push({ by: req.user._id, ...before, summary: changes.join(", ") });
    report.editedAt = new Date();
    await report.save(); // VersionError => 409

    if (labPlan) {
      if (labPlan.toCancel.length) {
        await LabOrder.updateMany(
          { _id: { $in: labPlan.toCancel.map((o) => o._id) }, status: "ordered" },
          { $set: { status: "cancelled" } }
        );
      }
      for (const w of labPlan.toUpdate) {
        await LabOrder.updateOne(
          { report: report._id, test: w.test._id, status: "ordered" },
          { $set: { priority: w.priority, instructions: w.instructions || "" } }
        );
      }
      if (labPlan.toCreate.length) {
        await LabOrder.insertMany(
          labPlan.toCreate.map((w) => ({
            report: report._id,
            patient: report.patient,
            doctor: req.user._id,
            appointment: report.appointment,
            test: w.test._id,
            testName: w.test.name,
            category: w.test.category,
            priority: w.priority,
            instructions: w.instructions,
          }))
        );
      }
    }

    res.json({
      message: "Report updated",
      ...(await loadFull(report._id)),
      lockedMedicines,
      lockedLabTests,
      changes,
    });
  } catch (error) {
    sendError(res, error, "Could not update report");
  }
};

// GET /api/reports/doctor/:reportId  (edit form, lab orders aur history ke saath)
exports.getDoctorReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    if (!mongoose.isValidObjectId(reportId)) throw fail(400, "Invalid report");
    const owned = await Report.exists({ _id: reportId, doctor: req.user._id });
    if (!owned) throw fail(404, "Report not found or not yours");
    res.json(await loadFull(reportId, true));
  } catch (error) {
    sendError(res, error, "Could not load report");
  }
};

// GET /api/reports/doctor/appointments
exports.getDoctorAppointmentsForReport = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id, status: { $ne: "cancelled" } })
      .populate("patient", "name email hospitalId")
      .sort({ date: -1 })
      .limit(200)
      .lean();

    const done = await Report.find({ appointment: { $in: appointments.map((a) => a._id) } })
      .select("_id appointment")
      .lean();
    const reportByAppt = Object.fromEntries(done.map((r) => [String(r.appointment), r._id]));

    res.json(
      appointments.map((a) => ({
        ...a,
        hasReport: !!reportByAppt[String(a._id)],
        reportId: reportByAppt[String(a._id)] || null,
      }))
    );
  } catch (error) {
    sendError(res, error, "Could not load appointments");
  }
};

// GET /api/reports/doctor/my-reports
exports.getDoctorReports = async (req, res) => {
  try {
    const reports = await Report.find({ doctor: req.user._id })
      .populate("patient", "name email hospitalId")
      .populate("prescribedMedicines.medicine", "name price")
      .sort({ createdAt: -1 })
      .lean();
    res.json(await attachLabOrders(reports));
  } catch (error) {
    sendError(res, error, "Could not load reports");
  }
};

// GET /api/reports/my
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ patient: req.user._id })
      .populate("doctor", "name specialization")
      .populate("prescribedMedicines.medicine", "name price")
      .sort({ createdAt: -1 })
      .lean();
    res.json(await attachLabOrders(reports));
  } catch (error) {
    sendError(res, error, "Could not load reports");
  }
};