const express = require("express");
const router = express.Router();
const c = require("../controllers/doctorInsightsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/admin/doctors", protect, authorize("admin"), c.adminDoctors);
router.get("/admin/doctors/:doctorId/patients", protect, authorize("admin"), c.adminDoctorPatients);
router.get("/my/patients", protect, authorize("doctor"), c.myPatients);

module.exports = router;