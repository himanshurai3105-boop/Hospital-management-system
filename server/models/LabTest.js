const mongoose = require("mongoose");
const { LAB_CATEGORY_KEYS } = require("../utils/labCategories");

// Result form ka structure yahin se banega (aur PDF ka table bhi)
const parameterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },   // e.g. Hemoglobin
    unit: { type: String, trim: true, default: "" },      // e.g. g/dL
    refMin: { type: Number },                             // normal range (number)
    refMax: { type: Number },
    refText: { type: String, trim: true },                // text range, e.g. "Negative"
  },
  { _id: false }
);

const labTestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, enum: LAB_CATEGORY_KEYS, required: true },
    price: { type: Number, default: 0, min: 0 },
    parameters: { type: [parameterSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabTest", labTestSchema);