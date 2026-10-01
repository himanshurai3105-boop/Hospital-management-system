const Razorpay = require("razorpay");
const crypto = require("crypto");
const MedicineOrder = require("../models/MedicineOrder");
const Report = require("../models/Report");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route POST /api/payments/create-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/payments/verify/medicine-order
exports.verifyMedicineOrderPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const order = await MedicineOrder.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = "paid";
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    res.json({ message: "Payment verified successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/payments/verify/report-medicine
exports.verifyReportMedicinePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, reportId, medicineItemId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const item = report.prescribedMedicines.id(medicineItemId);
    if (!item) return res.status(404).json({ message: "Medicine item not found" });

    item.paymentStatus = "paid";
    item.razorpayOrderId = razorpay_order_id;
    item.razorpayPaymentId = razorpay_payment_id;
    await report.save();

    res.json({ message: "Payment verified successfully", report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/payments/verify/appointment
// @desc  Verify payment for a doctor appointment
exports.verifyAppointmentPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const Appointment = require("../models/Appointment");
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.paymentStatus = "paid";
    appointment.razorpayOrderId = razorpay_order_id;
    appointment.razorpayPaymentId = razorpay_payment_id;
    await appointment.save();

    res.json({ message: "Payment verified successfully", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/payments/verify/room-booking
// @desc  Verify payment for a room/bed booking
exports.verifyRoomBookingPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const RoomBooking = require("../models/RoomBooking");
    const booking = await RoomBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.paymentStatus = "paid";
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    await booking.save();

    res.json({ message: "Payment verified successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};