const SCHEDULED_SPECIALIZATIONS = [
  "Cardiology", "Neurology", "Orthopedics", "Oncology", "Psychiatry",
  "Gynecology", "Urology", "Gastroenterology", "Nephrology", "Pulmonology",
];

const getBookingType = (specialization, shiftType) => {
  if (shiftType === "emergency") return "queue"; // emergency is always queue-based
  return SCHEDULED_SPECIALIZATIONS.includes(specialization) ? "scheduled" : "queue";
};

module.exports = { getBookingType, SCHEDULED_SPECIALIZATIONS };