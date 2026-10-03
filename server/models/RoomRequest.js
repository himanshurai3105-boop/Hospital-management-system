const mongoose = require("mongoose");

const roomRequestSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roomTypeNeeded: { type: String, enum: ["general", "private", "icu", "deluxe"], required: true },
    urgency: { type: String, enum: ["normal", "urgent", "emergency"], default: "normal" },
    notes: { type: String },
    status: { type: String, enum: ["pending", "allotted", "rejected", "completed"], default: "pending" },
    rejectReason: { type: String },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "RoomBooking" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomRequest", roomRequestSchema);