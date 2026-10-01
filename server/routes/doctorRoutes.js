const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  getMyPatients,
  getPatientProfile,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getAllDoctors);
router.get("/my-patients", protect, authorize("doctor"), getMyPatients);
router.get("/patients/:patientId/profile", protect, authorize("doctor"), getPatientProfile);
router.get("/:id", getDoctorById);
router.put("/profile", protect, authorize("doctor"), updateDoctorProfile);

module.exports = router;