const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  { start: { type: String, required: true }, end: { type: String, required: true } },
  { _id: false }
);

const shiftSettingsSchema = new mongoose.Schema({
  // Day shift: 10 AM - 6 PM, lunch 1:30 - 2:30 PM
  daySessions: {
    type: [sessionSchema],
    default: [
      { start: "10:00", end: "13:30" },
      { start: "14:30", end: "18:00" },
    ],
  },
  // Night shift: 10 PM - 6 AM, lunch 1:30 - 2:30 AM
  nightSessions: {
    type: [sessionSchema],
    default: [
      { start: "22:00", end: "01:30" },
      { start: "02:30", end: "06:00" },
    ],
  },
  // Emergency: 6 AM - 10 AM aur 6 PM - 10 PM
  emergencySessions: {
    type: [sessionSchema],
    default: [
      { start: "06:00", end: "10:00" },
      { start: "18:00", end: "22:00" },
    ],
  },
  bookingWindow: {
    day: { start: { type: String, default: "06:00" }, end: { type: String, default: "18:00" } },
    night: { start: { type: String, default: "18:00" }, end: { type: String, default: "06:00" } },
  },
});

// Singleton helper: hamesha wahi ek settings doc deta hai, na ho to bana deta hai
shiftSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("ShiftSettings", shiftSettingsSchema);