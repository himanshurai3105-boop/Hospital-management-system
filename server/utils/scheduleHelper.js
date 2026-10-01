const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
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
  let remaining = alreadyBookedCount;

  for (const session of sessions) {
    let startMin = toMinutes(session.start);
    let endMin = toMinutes(session.end);
    if (endMin <= startMin) endMin += 24 * 60;

    const durationMin = endMin - startMin;
    const capacity = Math.floor(durationMin / avgConsultationTime);

    if (remaining < capacity) {
      const slotStart = startMin + remaining * avgConsultationTime;
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
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  let startMin = toMinutes(window.start);
  let endMin = toMinutes(window.end);

  if (endMin <= startMin) {
    // window spans midnight (e.g. 18:00 - 06:00)
    return nowMin >= startMin || nowMin < endMin;
  }
  return nowMin >= startMin && nowMin < endMin;
};

// Which period are we in right now — used to decide which shiftType doctors to show
const getCurrentShiftPeriod = (settings) => {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const dayWindow = settings.bookingWindow.day;
  let startMin = toMinutes(dayWindow.start);
  let endMin = toMinutes(dayWindow.end);
  const inDayWindow = nowMin >= startMin && nowMin < endMin;
  return inDayWindow ? "day" : "night";
};

// Generates every discrete time slot for a set of sessions (used for calendar-based booking)
const generateAllSlots = (sessions, avgConsultationTime) => {
  const slots = [];
  for (const session of sessions) {
    let startMin = toMinutes(session.start);
    let endMin = toMinutes(session.end);
    if (endMin <= startMin) endMin += 24 * 60;

    for (let t = startMin; t + avgConsultationTime <= endMin; t += avgConsultationTime) {
      slots.push(minutesToLabel(t));
    }
  }
  return slots;
};

module.exports = { getSessions, getNextSlot, isWithinBookingWindow, getCurrentShiftPeriod, generateAllSlots };
