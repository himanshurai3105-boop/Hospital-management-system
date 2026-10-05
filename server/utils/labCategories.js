// Lab ki categories. Naya category chahiye to yahin ek line jodo.
const LAB_CATEGORIES = {
  pathology: "Pathology (Blood / Urine)",
  radiology: "Radiology (X-ray / CT / MRI / Ultrasound)",
  cardiac_tests: "Cardiac Tests (ECG / Echo / TMT)",
  microbiology: "Microbiology (Cultures)",
};

module.exports = { LAB_CATEGORIES, LAB_CATEGORY_KEYS: Object.keys(LAB_CATEGORIES) };