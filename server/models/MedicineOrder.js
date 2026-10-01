const mongoose = require("mongoose");

const medicineOrderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
        quantity: { type: Number, required: true },
        priceAtOrder: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicineOrder", medicineOrderSchema);