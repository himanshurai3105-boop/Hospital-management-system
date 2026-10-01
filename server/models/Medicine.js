const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String },
    manufacturer: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);