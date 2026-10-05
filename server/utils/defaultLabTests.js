module.exports = [
  {
    name: "Complete Blood Count (CBC)", category: "pathology", price: 350,
    parameters: [
      { name: "Hemoglobin", unit: "g/dL", refMin: 12, refMax: 17.5 },
      { name: "Total WBC Count", unit: "/µL", refMin: 4000, refMax: 11000 },
      { name: "Platelet Count", unit: "/µL", refMin: 150000, refMax: 450000 },
      { name: "RBC Count", unit: "million/µL", refMin: 4.0, refMax: 6.0 },
      { name: "Hematocrit (PCV)", unit: "%", refMin: 36, refMax: 52 },
    ],
  },
  { name: "Fasting Blood Sugar", category: "pathology", price: 80,
    parameters: [{ name: "Fasting Glucose", unit: "mg/dL", refMin: 70, refMax: 100 }] },
  { name: "Post-Prandial Blood Sugar", category: "pathology", price: 80,
    parameters: [{ name: "PP Glucose", unit: "mg/dL", refMin: 70, refMax: 140 }] },
  { name: "HbA1c", category: "pathology", price: 500,
    parameters: [{ name: "HbA1c", unit: "%", refMin: 4.0, refMax: 5.6 }] },
  {
    name: "Lipid Profile", category: "pathology", price: 600,
    parameters: [
      { name: "Total Cholesterol", unit: "mg/dL", refMin: 0, refMax: 200 },
      { name: "Triglycerides", unit: "mg/dL", refMin: 0, refMax: 150 },
      { name: "HDL Cholesterol", unit: "mg/dL", refMin: 40, refMax: 100 },
      { name: "LDL Cholesterol", unit: "mg/dL", refMin: 0, refMax: 100 },
    ],
  },
  {
    name: "Liver Function Test (LFT)", category: "pathology", price: 700,
    parameters: [
      { name: "Total Bilirubin", unit: "mg/dL", refMin: 0.2, refMax: 1.2 },
      { name: "SGOT (AST)", unit: "U/L", refMin: 5, refMax: 40 },
      { name: "SGPT (ALT)", unit: "U/L", refMin: 7, refMax: 56 },
      { name: "Alkaline Phosphatase", unit: "U/L", refMin: 44, refMax: 147 },
      { name: "Total Protein", unit: "g/dL", refMin: 6.0, refMax: 8.3 },
      { name: "Albumin", unit: "g/dL", refMin: 3.5, refMax: 5.0 },
    ],
  },
  {
    name: "Kidney Function Test (KFT)", category: "pathology", price: 650,
    parameters: [
      { name: "Urea", unit: "mg/dL", refMin: 15, refMax: 45 },
      { name: "Creatinine", unit: "mg/dL", refMin: 0.6, refMax: 1.3 },
      { name: "Uric Acid", unit: "mg/dL", refMin: 3.5, refMax: 7.2 },
      { name: "Sodium", unit: "mmol/L", refMin: 135, refMax: 145 },
      { name: "Potassium", unit: "mmol/L", refMin: 3.5, refMax: 5.1 },
    ],
  },
  {
    name: "Thyroid Profile", category: "pathology", price: 500,
    parameters: [
      { name: "TSH", unit: "mIU/L", refMin: 0.4, refMax: 4.0 },
      { name: "T3", unit: "ng/dL", refMin: 80, refMax: 200 },
      { name: "T4", unit: "µg/dL", refMin: 5.0, refMax: 12.0 },
    ],
  },
  {
    name: "Urine Routine", category: "pathology", price: 150,
    parameters: [
      { name: "pH", unit: "", refMin: 4.5, refMax: 8.0 },
      { name: "Specific Gravity", unit: "", refMin: 1.005, refMax: 1.03 },
      { name: "Protein", unit: "", refText: "Negative" },
      { name: "Glucose", unit: "", refText: "Negative" },
      { name: "Pus Cells", unit: "/HPF", refMin: 0, refMax: 5 },
      { name: "RBC", unit: "", refText: "Nil" },
    ],
  },
  { name: "Chest X-Ray", category: "radiology", price: 400, parameters: [] },
  { name: "Ultrasound Abdomen", category: "radiology", price: 900, parameters: [] },
  { name: "CT Scan Head", category: "radiology", price: 3500, parameters: [] },
  {
    name: "ECG", category: "cardiac_tests", price: 250,
    parameters: [
      { name: "Heart Rate", unit: "bpm", refMin: 60, refMax: 100 },
      { name: "PR Interval", unit: "ms", refMin: 120, refMax: 200 },
      { name: "QRS Duration", unit: "ms", refMin: 80, refMax: 120 },
      { name: "Rhythm", unit: "", refText: "Normal sinus rhythm" },
    ],
  },
  { name: "2D Echo", category: "cardiac_tests", price: 1800,
    parameters: [{ name: "Ejection Fraction", unit: "%", refMin: 55, refMax: 70 }] },
  { name: "Urine Culture & Sensitivity", category: "microbiology", price: 450,
    parameters: [{ name: "Organism Isolated", unit: "", refText: "No growth" }] },
];