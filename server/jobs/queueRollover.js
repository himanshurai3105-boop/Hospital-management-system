const Appointment = require("../models/Appointment");
const User = require("../models/User");
const S = require("../utils/slotTime");
const Q = require("../utils/queueShift");

// Har shift type ke liye alag: shift khatam hone par hi unfinished bookings agle din jaate hain
const rollover = async () => {
  const settings = await Q.loadSettings();
  for (const shift of ["day", "night", "emergency"]) {
    const shiftFilter = shift === "day" ? { $in: ["day", null] } : shift;
    const ids = await User.find({ role: "doctor", bookingType: "queue", shiftType: shiftFilter }).distinct("_id");
    if (!ids.length) continue;

    const current = Q.queueDateFor(settings, { shiftType: shift });
    const r = await Appointment.updateMany(
      { doctor: { $in: ids }, bookingType: "queue", status: "confirmed", queueDate: { $lt: current } },
      { $set: { queueDate: current, date: S.toDbDate(current), carriedOver: true } }
    );
    if (r.modifiedCount) console.log(`🔁 ${r.modifiedCount} ${shift}-shift bookings carried over to ${current}`);
  }
};

exports.startQueueRollover = () => {
  rollover().catch(console.error);
  setInterval(() => rollover().catch(console.error), 60 * 1000);
  console.log("✅ Queue rollover job started");
};