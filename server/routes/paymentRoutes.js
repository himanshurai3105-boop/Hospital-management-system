const express = require("express");
const router = express.Router();
const {
  createRazorpayOrder,
  verifyMedicineOrderPayment,
  verifyReportMedicinePayment,
  verifyAppointmentPayment,
  verifyRoomBookingPayment,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify/medicine-order", protect, verifyMedicineOrderPayment);
router.post("/verify/report-medicine", protect, verifyReportMedicinePayment);
router.post("/verify/appointment", protect, verifyAppointmentPayment);
router.post("/verify/room-booking", protect, verifyRoomBookingPayment);

module.exports = router;