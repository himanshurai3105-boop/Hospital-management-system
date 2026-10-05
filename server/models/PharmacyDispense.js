const mongoose = require("mongoose");

const pharmacyDispenseSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        report: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
        quantity: { type: Number, required: true },
        priceAtDispense: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["online", "cash"], default: "cash" },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PharmacyDispense", pharmacyDispenseSchema);