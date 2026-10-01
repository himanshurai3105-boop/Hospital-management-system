const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  { start: { type: String, required: true }, end: { type: String, required: true } },
  { _id: false }
);

const shiftSettingsSchema = new mongoose.Schema({
  daySessions: {
    type: [sessionSchema],
    default: [
      { start: "10:00", end: "13:30" },
      { start: "14:30", end: "18:00" },
    ],
  },
  nightSessions: {
    type: [sessionSchema],
    default: [{ start: "22:00", end: "01:00" }],
    default: [{ start: "02:00", end: "06:00" }],
  },
  emergencySessions: {
    type: [sessionSchema],
    default: [
      { start: "18:00", end: "22:00" },
      { start: "06:30", end: "10:00" },
    ],
  },
  bookingWindow: {
    day: { start: { type: String, default: "06:00" }, end: { type: String, default: "18:00" } },
    night: { start: { type: String, default: "18:00" }, end: { type: String, default: "06:00" } },
  },
});

// Singleton helper — always returns the one settings doc, creating it if missing
shiftSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("ShiftSettings", shiftSettingsSchema);