const express = require("express");
const router = express.Router();
const {
  createReport,
  getDoctorAppointmentsForReport,
  getDoctorReports,
  getMyReports,
  updateMedicineStatus,
} = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("doctor"), createReport);
router.get("/doctor/appointments", protect, authorize("doctor"), getDoctorAppointmentsForReport);
router.get("/doctor/my-reports", protect, authorize("doctor"), getDoctorReports);
router.get("/my", protect, authorize("patient"), getMyReports);
router.put("/:reportId/medicine/:itemId/status", protect, authorize("patient"), updateMedicineStatus);

module.exports = router;