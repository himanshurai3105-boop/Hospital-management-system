const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    paidDate: { type: Date },
  },
  { timestamps: true }
);

// Ek doctor ke liye ek month/year ka sirf ek hi salary record ho
salarySchema.index({ doctor: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Salary", salarySchema);