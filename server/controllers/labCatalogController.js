const mongoose = require("mongoose");
const LabTest = require("../models/LabTest");
const { LAB_CATEGORY_KEYS } = require("../utils/labCategories");
const DEFAULT_TESTS = require("../utils/defaultLabTests");

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fail = (status, message) => Object.assign(new Error(message), { status });
const sendError = (res, error, fallback) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  if (error.code === 11000) return res.status(409).json({ message: "A test with this name already exists" });
  console.error(error);
  return res.status(500).json({ message: fallback });
};

const numOrUndef = (v) => {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw fail(400, "Reference range must be a number");
  return n;
};

const cleanParameters = (arr) => {
  if (arr == null) return [];
  if (!Array.isArray(arr) || arr.length > 50) throw fail(400, "Up to 50 parameters allowed");
  const seen = new Set();
  return arr.map((p) => {
    const name = String(p?.name || "").trim().slice(0, 80);
    if (!name) throw fail(400, "Every parameter needs a name");
    if (seen.has(name.toLowerCase())) throw fail(400, `Parameter "${name}" is added twice`);
    seen.add(name.toLowerCase());
    const refMin = numOrUndef(p.refMin);
    const refMax = numOrUndef(p.refMax);
    if (refMin !== undefined && refMax !== undefined && refMin > refMax) {
      throw fail(400, `Min is greater than max for "${name}"`);
    }
    return {
      name,
      unit: String(p.unit || "").trim().slice(0, 20),
      refMin,
      refMax,
      refText: String(p.refText || "").trim().slice(0, 80) || undefined,
    };
  });
};

const cleanBody = (body) => {
  const name = String(body.name || "").trim().slice(0, 100);
  if (!name) throw fail(400, "Test name is required");
  if (!LAB_CATEGORY_KEYS.includes(body.category)) throw fail(400, "Select a valid category");
  const price = Number(body.price || 0);
  if (!Number.isFinite(price) || price < 0) throw fail(400, "Price must be 0 or more");
  return { name, category: body.category, price, parameters: cleanParameters(body.parameters) };
};

// GET /api/lab/tests?q=&category=&all=1(admin)
exports.listTests = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = {};
    if (!(req.user.role === "admin" && req.query.all === "1")) filter.isActive = true;
    if (LAB_CATEGORY_KEYS.includes(req.query.category)) filter.category = req.query.category;
    if (q) filter.name = new RegExp(esc(q), "i");

    const query = LabTest.find(filter).sort({ category: 1, name: 1 });
    if (req.user.role !== "admin") query.select("name category price"); // doctor ko parameters nahi chahiye
    res.json(await query.lean());
  } catch (error) {
    sendError(res, error, "Could not load lab tests");
  }
};

// POST /api/lab/tests
exports.createTest = async (req, res) => {
  try {
    const test = await LabTest.create(cleanBody(req.body));
    res.status(201).json(test);
  } catch (error) {
    sendError(res, error, "Could not create test");
  }
};

// PUT /api/lab/tests/:id
exports.updateTest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid test");
    const test = await LabTest.findById(req.params.id);
    if (!test) throw fail(404, "Test not found");
    Object.assign(test, cleanBody(req.body)); // purane orders mein naam/category ka snapshot hai, wo nahi badlega
    await test.save();
    res.json(test);
  } catch (error) {
    sendError(res, error, "Could not update test");
  }
};

// PUT /api/lab/tests/:id/toggle
exports.toggleTest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid test");
    const test = await LabTest.findById(req.params.id);
    if (!test) throw fail(404, "Test not found");
    test.isActive = !test.isActive;
    await test.save();
    res.json({ isActive: test.isActive });
  } catch (error) {
    sendError(res, error, "Could not update test");
  }
};

// POST /api/lab/tests/seed-defaults  (jo already hain unhe nahi chhedta)
exports.seedDefaults = async (req, res) => {
  try {
    let added = 0;
    for (const t of DEFAULT_TESTS) {
      const { name, ...rest } = t;
      const r = await LabTest.updateOne({ name }, { $setOnInsert: rest }, { upsert: true });
      if (r.upsertedCount) added += 1;
    }
    res.json({ message: `${added} test(s) added`, added });
  } catch (error) {
    sendError(res, error, "Could not add default tests");
  }
};