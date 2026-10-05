const express = require("express");
const router = express.Router();
const {
  createReport,
  updateReport,
  getDoctorReport,
  searchMedicines,
  getDoctorAppointmentsForReport,
  getDoctorReports,
  getMyReports,
} = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("doctor"), createReport);
router.get("/doctor/appointments", protect, authorize("doctor"), getDoctorAppointmentsForReport);
router.get("/doctor/my-reports", protect, authorize("doctor"), getDoctorReports);
router.get("/doctor/medicines", protect, authorize("doctor"), searchMedicines);
router.get("/doctor/:reportId", protect, authorize("doctor"), getDoctorReport);
router.put("/:reportId", protect, authorize("doctor"), updateReport);
router.get("/my", protect, authorize("patient"), getMyReports);

module.exports = router;