const express = require("express");
const router = express.Router();
const {
  searchPatients,
  registerWalkInPatient,
  getDoctorsForBooking,
  bookAppointmentForPatient,
  verifyReceptionistPayment,
  getTodayAllAppointments,
} = require("../controllers/receptionistController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("receptionist"));

router.get("/patients/search", searchPatients);
router.post("/patients/register", registerWalkInPatient);
router.get("/doctors", getDoctorsForBooking);
router.post("/appointments/book", bookAppointmentForPatient);
router.put("/appointments/:id/verify-online-payment", verifyReceptionistPayment);
router.get("/appointments/today", getTodayAllAppointments);

module.exports = router;