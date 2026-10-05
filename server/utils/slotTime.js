const TZ = "Asia/Kolkata";
const SLOT_MINUTES = 30;
const START_HOUR = 9;   // 9 AM
const END_HOUR = 19;    // 7 PM (last slot 6:30 - 7:00 PM)
const BUFFER_MINUTES = 30;
const WINDOW_DAYS = 15; // aaj + agle 14 din

const getTodayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

const getNowMinutes = () => {
  const t = new Date().toLocaleTimeString("en-GB", {
    timeZone: TZ, hourCycle: "h23", hour: "2-digit", minute: "2-digit",
  });
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// IST ke hisaab se ek din ki range (purane UTC-midnight records bhi isme aa jate hain)
const dayRange = (dateStr) => {
  const start = new Date(`${dateStr}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
};

const toDbDate = (dateStr) => new Date(`${dateStr}T00:00:00+05:30`);

const formatTime = (min) => {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
};

// ["09:00 AM - 09:30 AM", ..., "06:30 PM - 07:00 PM"]
const generateSlots = () => {
  const slots = [];
  for (let s = START_HOUR * 60; s + SLOT_MINUTES <= END_HOUR * 60; s += SLOT_MINUTES) {
    slots.push(`${formatTime(s)} - ${formatTime(s + SLOT_MINUTES)}`);
  }
  return slots;
};

const parseStartMinutes = (timeSlot) => {
  const start = String(timeSlot).split(/\s*[-–]\s*/)[0].trim();
  const m = start.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
};

const isDateInWindow = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "")) return false;
  const today = getTodayStr();
  return dateStr >= today && dateStr <= addDays(today, WINDOW_DAYS - 1);
};

// Aaj ke liye 30 min buffer, future date ke liye hamesha true
const isSlotBookable = (dateStr, timeSlot) => {
  const today = getTodayStr();
  if (dateStr < today) return false;
  if (dateStr > today) return true;
  const start = parseStartMinutes(timeSlot);
  if (start === null) return false;
  return start - getNowMinutes() >= BUFFER_MINUTES;
};

// Purane 15-min records bhi naye 30-min slot ko block karein
const isBlocked = (slotStart, bookedStarts) =>
  bookedStarts.some((e) => e > slotStart - 15 && e < slotStart + SLOT_MINUTES);

const buildDay = (dateStr, bookedStarts = []) =>
  generateSlots().map((timeSlot) => {
    const s = parseStartMinutes(timeSlot);
    return { timeSlot, available: isSlotBookable(dateStr, timeSlot) && !isBlocked(s, bookedStarts) };
  });

module.exports = {
  TZ, WINDOW_DAYS, getTodayStr, addDays, dayRange, toDbDate,
  generateSlots, parseStartMinutes, isDateInWindow, isSlotBookable, isBlocked, buildDay,
};