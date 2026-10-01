const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    bedNumber: { type: String, required: true }, // e.g. "101-A"
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    currentPatient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bed", bedSchema);