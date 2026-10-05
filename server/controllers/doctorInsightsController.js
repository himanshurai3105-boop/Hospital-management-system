const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const S = require("../utils/slotTime");
const { CONFIRMED_LIMIT } = require("../utils/queueShift");

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
const toInt = (v, lo, hi) => {
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};

// Filter do tarah ka:
//  1) from / to  -> date range (dono din shamil)
//  2) day / month / year -> koi bhi combination (IST ke hisaab se)
const dateFilter = (query) => {
  let { from, to } = query;
  if (isDate(from) || isDate(to)) {
    if (isDate(from) && isDate(to) && from > to) [from, to] = [to, from];
    const range = {};
    if (isDate(from)) range.$gte = S.dayRange(from).start;
    if (isDate(to)) range.$lt = S.dayRange(to).end;
    return { date: range };
  }

  const day = toInt(query.day, 1, 31);
  const month = toInt(query.month, 1, 12);
  const year = toInt(query.year, 2000, 2100);
  const src = { date: "$date", timezone: S.TZ };
  const conds = [];
  if (year) conds.push({ $eq: [{ $year: src }, year] });
  if (month) conds.push({ $eq: [{ $month: src }, month] });
  if (day) conds.push({ $eq: [{ $dayOfMonth: src }, day] });
  return conds.length ? { $expr: { $and: conds } } : {};
};

// Filter agar ek hi din ka ho to "YYYY-MM-DD" deta hai, warna null
const singleDay = (query) => {
  const pad = (n) => String(n).padStart(2, "0");
  let s = null;
  if (isDate(query.from) && query.from === query.to) {
    s = query.from;
  } else if (!query.from && !query.to) {
    const d = toInt(query.day, 1, 31);
    const m = toInt(query.month, 1, 12);
    const y = toInt(query.year, 2000, 2100);
    if (d && m && y) s = `${y}-${pad(m)}-${pad(d)}`;
  }
  if (!s) return null;
  const t = new Date(`${s}T00:00:00Z`);
  return !isNaN(t) && t.toISOString().slice(0, 10) === s ? s : null;
};

const listPatients = async (doctorId, query) => {
  const q = String(query.q || "").trim();
  const limit = Math.min(Number(query.limit) || 20, 50);
  const page = Math.max(Number(query.page) || 1, 1);
  const doctor = new mongoose.Types.ObjectId(doctorId);

  const match = {
    doctor,
    status: query.status === "all" ? { $ne: "cancelled" } : "completed",
    ...dateFilter(query),
  };

  const pipeline = [
    { $match: match },
    { $lookup: { from: User.collection.name, localField: "patient", foreignField: "_id", as: "p" } },
    { $unwind: "$p" },
  ];
  if (q) {
    const rx = new RegExp(esc(q), "i");
    pipeline.push({ $match: { $or: [{ "p.name": rx }, { "p.hospitalId": rx }, { "p.phone": rx }] } });
  }
  pipeline.push(
    {
      $group: {
        _id: "$patient",
        name: { $first: "$p.name" },
        hospitalId: { $first: "$p.hospitalId" },
        phone: { $first: "$p.phone" },
        visits: { $sum: 1 },
        lastVisit: { $max: "$date" },
        firstVisit: { $min: "$date" },
      },
    },
    { $sort: { lastVisit: -1 } },
    { $facet: { data: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: "n" }] } }
  );

  const [out] = await Appointment.aggregate(pipeline);
  const patients = out.data;
  const total = out.total[0]?.n || 0;

  // aage ki appointment (is doctor ke saath)
  const upcoming = await Appointment.aggregate([
    {
      $match: {
        doctor,
        patient: { $in: patients.map((p) => p._id) },
        status: { $in: ["confirmed", "pending", "waiting"] },
        date: { $gte: S.dayRange(S.getTodayStr()).start },
      },
    },
    { $group: { _id: "$patient", next: { $min: "$date" } } },
  ]);
  const nextMap = Object.fromEntries(upcoming.map((u) => [String(u._id), u.next]));

  return {
    total, page, pages: Math.max(1, Math.ceil(total / limit)),
    patients: patients.map((p) => ({ ...p, nextAppointment: nextMap[String(p._id)] || null })),
  };
};

// GET /doctor-insights/my/patients   (doctor, apne patients)
exports.myPatients = async (req, res) => {
  try {
    res.json(await listPatients(req.user._id, req.query));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load patients" });
  }
};

// GET /doctor-insights/admin/doctors/:doctorId/patients   (admin)
exports.adminDoctorPatients = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.doctorId)) return res.status(400).json({ message: "Invalid doctor" });
    res.json(await listPatients(req.params.doctorId, req.query));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load patients" });
  }
};

// GET /doctor-insights/admin/doctors?q=&date=   (admin, doctor search + din ke stats)
// GET /doctor-insights/admin/doctors?q=&day=&month=&year=&from=&to=
exports.adminDoctors = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    const filter = { role: "doctor" };
    if (q) {
      const rx = new RegExp(esc(q), "i");
      const or = [{ name: rx }, { email: rx }, { employeeId: rx }, { hospitalId: rx }];
      if (mongoose.isValidObjectId(q)) or.push({ _id: q });
      filter.$or = or;
    }
    const doctors = await User.find(filter)
      .select("name email specialization bookingType shiftType employeeId hospitalId")
      .sort({ name: 1 })
      .limit(100);

    // Ek din ho to queue date se (night shift sahi aaye), warna date/range filter se
    const day = singleDay(req.query);
    let timeMatch;
    if (day) {
      const { start, end } = S.dayRange(day);
      timeMatch = {
        $or: [
          { bookingType: "queue", queueDate: day },
          { bookingType: { $ne: "queue" }, date: { $gte: start, $lt: end } },
        ],
      };
    } else {
      timeMatch = dateFilter(req.query);
    }

    const rows = await Appointment.aggregate([
      { $match: { doctor: { $in: doctors.map((d) => d._id) }, ...timeMatch } },
      { $group: { _id: { d: "$doctor", s: "$status" }, n: { $sum: 1 } } },
    ]);

    const by = {};
    for (const r of rows) {
      const k = String(r._id.d);
      (by[k] = by[k] || {})[r._id.s] = r.n;
    }

    const result = doctors.map((d) => {
      const c = by[String(d._id)] || {};
      const completed = c.completed || 0;
      const cancelled = c.cancelled || 0;
      const active = (c.confirmed || 0) + (c.pending || 0) + (c.waiting || 0);
      const split = d.bookingType === "queue" && !!day; // confirmed/waiting ka split sirf ek din ke liye
      return {
        _id: d._id,
        name: d.name,
        specialization: d.specialization,
        employeeId: d.hospitalId || d.employeeId || null,
        bookingType: d.bookingType,
        shiftType: d.shiftType || (d.bookingType === "queue" ? "day" : null),
        total: completed + active,
        completed,
        cancelled,
        confirmed: split ? Math.min(CONFIRMED_LIMIT, active) : active,
        waiting: split ? Math.max(0, active - CONFIRMED_LIMIT) : 0,
      };
    });
    res.json({ singleDay: !!day, doctors: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load doctors" });
  }
};