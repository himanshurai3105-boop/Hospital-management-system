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
  addStaff,
  getAllStaff,
  editStaff,
toggleStaffStatus,
deleteStaff,

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
router.post("/staff", addStaff);
router.get("/staff", getAllStaff);
router.put("/staff/:id", editStaff);
router.put("/staff/:id/toggle-status", toggleStaffStatus);
router.delete("/staff/:id", deleteStaff);
module.exports = router;