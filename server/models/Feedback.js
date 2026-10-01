const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Ek patient ek appointment ke liye sirf ek hi review de sake
feedbackSchema.index({ appointment: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);