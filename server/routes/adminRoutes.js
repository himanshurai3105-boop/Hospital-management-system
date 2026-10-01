const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAnalytics,
  addDoctor,
  editDoctor,
  deleteDoctor,
  toggleDoctorStatus,
  getAllDoctorsAdmin,
  getAllPatients,
  triggerAutoCancelJob,
  getPatientFullRecord,
  addReceptionist,
  getAllReceptionists,
  toggleReceptionistStatus,
  deleteReceptionist,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/analytics", getAnalytics);
router.get("/doctors", getAllDoctorsAdmin);
router.post("/doctors", addDoctor);
router.put("/doctors/:id", editDoctor);
router.put("/doctors/:id/toggle-status", toggleDoctorStatus);
router.delete("/doctors/:id", deleteDoctor);
router.get("/patients", getAllPatients);
router.get("/patients/:id/full-record", getPatientFullRecord);
router.post("/trigger-auto-cancel", triggerAutoCancelJob);
router.post("/receptionists", addReceptionist);
router.get("/receptionists", getAllReceptionists);
router.put("/receptionists/:id/toggle-status", toggleReceptionistStatus);
router.delete("/receptionists/:id", deleteReceptionist);

module.exports = router;