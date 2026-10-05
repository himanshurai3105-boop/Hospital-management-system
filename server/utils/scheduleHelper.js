const TZ = "Asia/Kolkata";

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Abhi IST mein kitne minute huye (server kisi bhi timezone mein ho)
const nowMinutesIST = () => {
  const t = new Date().toLocaleTimeString("en-GB", {
    timeZone: TZ, hourCycle: "h23", hour: "2-digit", minute: "2-digit",
  });
  return toMinutes(t);
};

const minutesToLabel = (totalMinutes) => {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};

const getSessions = (settings, shiftType) => {
  if (shiftType === "night") return settings.nightSessions;
  if (shiftType === "emergency") return settings.emergencySessions;
  return settings.daySessions;
};

const getNextSlot = (sessions, avgConsultationTime, alreadyBookedCount) => {
  const avg = avgConsultationTime > 0 ? avgConsultationTime : 15;
  let remaining = alreadyBookedCount;

  for (const session of sessions) {
    const startMin = toMinutes(session.start);
    let endMin = toMinutes(session.end);
    if (endMin <= startMin) endMin += 24 * 60;

    const durationMin = endMin - startMin;
    const capacity = Math.floor(durationMin / avg);

    if (remaining < capacity) {
      const slotStart = startMin + remaining * avg;
      return { timeSlot: minutesToLabel(slotStart), session: `${session.start}-${session.end}` };
    }
    remaining -= capacity;
  }

  return null;
};

// Is booking currently open for this doctor's shift type?
// Emergency doctors are always bookable (24/7).
const isWithinBookingWindow = (settings, shiftType) => {
  if (shiftType === "emergency") return true;

  const window = shiftType === "night" ? settings.bookingWindow.night : settings.bookingWindow.day;
  const nowMin = nowMinutesIST();
  const startMin = toMinutes(window.start);
  const endMin = toMinutes(window.end);

  if (endMin <= startMin) {
    // window spans midnight (e.g. 18:00 - 06:00)
    return nowMin >= startMin || nowMin < endMin;
  }
  return nowMin >= startMin && nowMin < endMin;
};

// Which period are we in right now — used to decide which shiftType doctors to show
const getCurrentShiftPeriod = (settings) => {
  const nowMin = nowMinutesIST();
  const dayWindow = settings.bookingWindow.day;
  const startMin = toMinutes(dayWindow.start);
  const endMin = toMinutes(dayWindow.end);
  const inDayWindow = nowMin >= startMin && nowMin < endMin;
  return inDayWindow ? "day" : "night";
};

// Generates every discrete time slot for a set of sessions (used for calendar-based booking)
const generateAllSlots = (sessions, avgConsultationTime) => {
  const avg = avgConsultationTime > 0 ? avgConsultationTime : 15;
  const slots = [];
  for (const session of sessions) {
    const startMin = toMinutes(session.start);
    let endMin = toMinutes(session.end);
    if (endMin <= startMin) endMin += 24 * 60;

    for (let t = startMin; t + avg <= endMin; t += avg) {
      slots.push(minutesToLabel(t));
    }
  }
  return slots;
};

module.exports = { getSessions, getNextSlot, isWithinBookingWindow, getCurrentShiftPeriod, generateAllSlots };