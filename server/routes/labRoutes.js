const express = require("express");
const router = express.Router();
const c = require("../controllers/labCatalogController");
const w = require("../controllers/labWorkController");
const { protect, authorize, requireStaffType } = require("../middleware/authMiddleware");

const labTech = [protect, authorize("staff"), requireStaffType("lab_technician")];

// Test catalog: doctor, admin, lab technician padh sakte hain
const catalogReaders = (req, res, next) => {
  const u = req.user;
  if (u.role === "doctor" || u.role === "admin" || (u.role === "staff" && u.staffType === "lab_technician")) {
    return next();
  }
  return res.status(403).json({ message: "Not allowed" });
};

// ----- catalog -----
router.get("/tests", protect, catalogReaders, c.listTests);
router.post("/tests/seed-defaults", protect, authorize("admin"), c.seedDefaults);
router.post("/tests", protect, authorize("admin"), c.createTest);
router.put("/tests/:id/toggle", protect, authorize("admin"), c.toggleTest);
router.put("/tests/:id", protect, authorize("admin"), c.updateTest);

// ----- lab technician -----
router.get("/queue", ...labTech, w.getQueue);
router.get("/orders/:id/pdf", protect, w.getPdf); // access ka check controller mein
router.get("/orders/:id", ...labTech, w.getOrder);
router.put("/orders/:id/collect-sample", ...labTech, w.collectSample);
router.post("/orders/:id/result", ...labTech, w.submitResult);
router.put("/orders/:id/result", ...labTech, w.amendResult);

// ----- patient / doctor / admin -----
router.get("/my/results", protect, authorize("patient"), w.getMyResults);
router.get("/patient/:patientId/results", protect, authorize("doctor", "admin"), w.getPatientResults);

module.exports = router;