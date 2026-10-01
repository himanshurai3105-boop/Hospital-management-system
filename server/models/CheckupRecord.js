const mongoose = require("mongoose");

const checkupRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
    scheduledDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    resultNotes: { type: String },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckupRecord", checkupRecordSchema);