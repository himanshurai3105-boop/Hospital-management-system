const express = require("express");
const router = express.Router();
const {
  getMyAppointments,
  getTodayAppointments,
  updateAppointmentStatus,
  getAllAppointments,
  getQueueStatus,
  checkAvailability,
  bookAppointmentWithPayment,
  getScheduledAvailability,
  getScheduledOverview,
  bookScheduledWithPayment,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/my", protect, authorize("patient"), getMyAppointments);
router.get("/doctor/today", protect, authorize("doctor"), getTodayAppointments);
router.put("/:id/status", protect, authorize("doctor"), updateAppointmentStatus);
router.get("/", protect, authorize("admin"), getAllAppointments);
router.get("/:id/queue", protect, authorize("patient"), getQueueStatus);
router.post("/book-with-payment", protect, authorize("patient"), bookAppointmentWithPayment);
router.get("/availability/:doctorId", protect, authorize("patient"), checkAvailability);
router.get("/scheduled/availability/:doctorId", protect, authorize("patient"), getScheduledAvailability);
router.get("/scheduled/overview/:doctorId", protect, authorize("patient"), getScheduledOverview);
router.post("/scheduled/book-with-payment", protect, authorize("patient"), bookScheduledWithPayment);
module.exports = router;