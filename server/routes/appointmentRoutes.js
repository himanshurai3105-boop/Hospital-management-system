const express = require("express");
const router = express.Router();
const {
  getMyAppointments,
  getTodayAppointments,
  updateAppointmentStatus,
  getAllAppointments,
  getQueueStatus,
} = require("../controllers/appointmentController");
const sb = require("../controllers/scheduledBookingController");
const { protect, authorize } = require("../middleware/authMiddleware");

const q = require("../controllers/queueBookingController");

router.get("/queue/availability/:doctorId", protect, authorize("patient"), q.getAvailability);
router.post("/queue/book-with-payment", protect, authorize("patient"), q.bookWithPayment);
router.get("/queue/my", protect, authorize("patient"), q.getMyQueue);
router.get("/queue/doctor-summary", protect, authorize("doctor"), q.getDoctorSummary);
router.get("/queue/:id/switch-options", protect, authorize("patient"), q.getSwitchOptions);
router.post("/queue/:id/switch", protect, authorize("patient"), q.switchDoctor);
router.post("/queue/:id/cancel", protect, authorize("patient"), q.cancel);

// ---------- Special (calendar) booking: naya controller ----------
router.get("/scheduled/overview/:doctorId", protect, authorize("patient"), sb.getOverview);
router.get("/scheduled/availability/:doctorId", protect, authorize("patient"), sb.getAvailability);
router.get("/scheduled/free-doctors", protect, authorize("patient"), sb.getFreeDoctors);
router.post("/scheduled/precheck", protect, authorize("patient"), sb.precheck);
router.post("/scheduled/book-with-payment", protect, authorize("patient"), sb.bookWithPayment);

// ---------- Daily (queue) booking: purana controller, waisa hi ----------

// ---------- Baaki appointment routes ----------
router.get("/my", protect, authorize("patient"), getMyAppointments);
router.get("/doctor/today", protect, authorize("doctor"), getTodayAppointments);
router.get("/", protect, authorize("admin"), getAllAppointments);
router.get("/:id/queue", protect, authorize("patient"), getQueueStatus);
router.put("/:id/status", protect, authorize("doctor"), updateAppointmentStatus);

module.exports = router;