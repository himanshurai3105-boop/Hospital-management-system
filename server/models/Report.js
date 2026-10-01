const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    diagnosis: { type: String, required: true },
    prescription: { type: String },
    notes: { type: String },
    prescribedMedicines: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
        quantity: { type: Number, required: true, default: 1 },
        status: { type: String, enum: ["pending", "taken"], default: "pending" },
        paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);