const { getSessions, getNextSlot, isWithinBookingWindow } = require("./scheduleHelper");
const S = require("./slotTime");

const CONFIRMED_LIMIT = 20; // pehle 20 confirmed
const DAILY_MAX = 100;      // ek queue-day mein max bookings (yahin se badlo)

// Sirf tab use hota hai jab Shift Settings load na ho (model ke defaults ke barabar)
const DEFAULT_SETTINGS = {
  daySessions: [{ start: "10:00", end: "13:30" }, { start: "14:30", end: "18:00" }],
  nightSessions: [{ start: "22:00", end: "01:30" }, { start: "02:30", end: "06:00" }],
  emergencySessions: [{ start: "06:00", end: "10:00" }, { start: "18:00", end: "22:00" }],
  bookingWindow: { day: { start: "06:00", end: "18:00" }, night: { start: "18:00", end: "06:00" } },
};

const loadSettings = async () => {
  try {
    const Model = require("../models/ShiftSettings");
    return await Model.getSettings();
  } catch (e) {
    console.warn("ShiftSettings load failed, using defaults:", e.message);
    return DEFAULT_SETTINGS;
  }
};

const shiftOf = (doctor) => doctor?.shiftType || "day";
const sessionsFor = (settings, doctor) => getSessions(settings, shiftOf(doctor));

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const nowMinutes = () => {
  const t = new Date().toLocaleTimeString("en-GB", {
    timeZone: S.TZ, hourCycle: "h23", hour: "2-digit", minute: "2-digit",
  });
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Is doctor ki "abhi wali" queue kis date ki hai?
//  day/emergency: shift khatam hone ke baad agle din ki queue
//  night (10 PM - 6 AM): raat 12 se subah 6 tak pichli date ki queue
const queueDateFor = (settings, doctor) => {
  const sessions = sessionsFor(settings, doctor);
  const today = S.getTodayStr();
  const now = nowMinutes();
  const crossesMidnight = sessions.some((s) => toMin(s.end) <= toMin(s.start));

  if (crossesMidnight) {
    const lastEnd = toMin(sessions[sessions.length - 1].end);
    return now < lastEnd ? S.addDays(today, -1) : today;
  }
  const lastEnd = Math.max(...sessions.map((s) => toMin(s.end)));
  return now >= lastEnd ? S.addDays(today, 1) : today;
};

const isOpen = (settings, doctor) => isWithinBookingWindow(settings, shiftOf(doctor));

// index = kitne log aage hain; lunch gap sessions se apne aap skip ho jaata hai
const estimate = (settings, doctor, index) => {
  const slot = getNextSlot(sessionsFor(settings, doctor), doctor.avgConsultationTime || 15, index);
  return slot ? slot.timeSlot : null;
};

module.exports = {
  CONFIRMED_LIMIT, DAILY_MAX, loadSettings, shiftOf, queueDateFor, isOpen, estimate,
};