const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { LAB_CATEGORY_KEYS } = require("../utils/labCategories");

const ID_PREFIX = { admin: "ADM", doctor: "DOC", patient: "PAT", receptionist: "REC", staff: "STF" };

const userSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: true },
    hospitalId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: { type: String, required: true, minlength: 8 },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"],
    },
    profilePhoto: { type: String, default: "" },
    aadhaarNumber: {
      type: String,
      match: [/^\d{12}$/, "Aadhaar number must be exactly 12 digits"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "doctor", "patient", "receptionist", "staff"],
      default: "patient",
    },
    staffType: {
      type: String,
      enum: ["nurse", "ward_boy", "pharmacist", "lab_technician", "cleaner", "security", "bed_coordinator", "other"],
    },
    // Sirf lab_technician ke liye: kis category ke tests dekhega
    // (required check admin staff-create controller mein lagega, taaki purane records na tootein)
    labSpecialization: { type: String, enum: LAB_CATEGORY_KEYS },

    age: { type: Number, min: 0, max: 120 },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String },

    specialization: { type: String },
    experience: { type: Number },
    fees: { type: Number },
    baseSalary: { type: Number, default: 0 },
    avgConsultationTime: { type: Number, default: 15 }, // minutes per patient
    dailyCapacity: { type: Number, default: 100 },
    shiftType: { type: String, enum: ["day", "night", "emergency"], default: "day" },
    bookingType: { type: String, enum: ["scheduled", "queue"], default: "queue" },
    availableDays: [{ type: String }],
    availableTime: { type: String },
  },
  { timestamps: true }
);

// Hospital ID tabhi banao jab pehle se na ho (seed script ki ID ko na chhedo)
userSchema.pre("save", async function () {
  if (this.isNew && !this.hospitalId) {
    const prefix = ID_PREFIX[this.role] || "PAT";

    let unique = false;
    let newId;
    while (!unique) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      newId = `CTC-${prefix}-${randomNum}`;
      const exists = await mongoose.model("User").findOne({ hospitalId: newId });
      if (!exists) unique = true;
    }
    this.hospitalId = newId;
  }

  if (
    this.role === "doctor" &&
    (this.isNew || this.isModified("specialization") || this.isModified("shiftType"))
  ) {
    const { getBookingType } = require("../utils/bookingTypeHelper");
    this.bookingType = getBookingType(this.specialization, this.shiftType);
  }

  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);