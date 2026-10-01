const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "X-Ray Machine"
    type: {
      type: String,
      enum: ["X-Ray", "MRI", "CT Scan", "ECG", "Ultrasound", "Blood Test", "Other"],
      required: true,
    },
    location: { type: String }, // e.g. "Radiology Dept, Floor 2"
    status: {
      type: String,
      enum: ["available", "in-use", "maintenance"],
      default: "available",
    },
    costPerUse: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipment", equipmentSchema);