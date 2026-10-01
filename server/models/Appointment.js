const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ["pending", "waiting", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    cancelReason: { type: String },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refund_pending", "refunded"], default: "unpaid" },
    paymentMethod: { type: String, enum: ["online", "cash"], default: "online" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpayRefundId: { type: String },
  
  },
  { timestamps: true }
);


module.exports = mongoose.model("Appointment", appointmentSchema);