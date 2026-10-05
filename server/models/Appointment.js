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
    
  // NEW: queue (daily) ya scheduled (special calendar) booking
    bookingType: { type: String, enum: ["queue", "scheduled"], default: "queue" },
    queueDate: { type: String },
    priorityDate: { type: String },
    seq: { type: Number },
    carriedOver: { type: Boolean, default: false },
    amountPaid: { type: Number },
    refundAmount: { type: Number },
  },
  { timestamps: true }
  );

// NEW: ek doctor ka ek date + slot par sirf ek active scheduled appointment
appointmentSchema.index(
  { doctor: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      bookingType: "scheduled",
      status: { $in: ["pending", "waiting", "confirmed"] },
    },
  }
);


module.exports = mongoose.model("Appointment", appointmentSchema);