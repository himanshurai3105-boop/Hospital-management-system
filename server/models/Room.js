const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    roomType: {
      type: String,
      enum: ["general", "private", "icu", "deluxe"],
      required: true,
    },
    pricePerDay: { type: Number, required: true },
    totalBeds: { type: Number, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);