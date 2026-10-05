const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

// Har edit par purani report ki copy yahan jama hoti hai
const revisionSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: ObjectId, ref: "User" },
    diagnosis: String,
    prescription: String,
    notes: String,
    followUpDate: Date,
    medicines: [{ medicine: ObjectId, quantity: Number, status: String }],
    summary: String, // kya badla, e.g. "diagnosis, medicines"
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    patient: { type: ObjectId, ref: "User", required: true },
    doctor: { type: ObjectId, ref: "User", required: true },
    appointment: { type: ObjectId, ref: "Appointment" },
    diagnosis: { type: String, required: true },
    prescription: { type: String },
    notes: { type: String },
    followUpDate: { type: Date },
    prescribedMedicines: [
      {
        medicine: { type: ObjectId, ref: "Medicine", required: true },
        quantity: { type: Number, required: true, default: 1 },
        status: { type: String, enum: ["pending", "dispensed"], default: "pending" },
        dispensedBy: { type: ObjectId, ref: "User" },
        dispensedAt: { type: Date },
        dispense: { type: ObjectId, ref: "PharmacyDispense" },
      },
    ],
    editedAt: { type: Date },
    // select: false, to patient ki list mein ye bhari history nahi jaati
    revisions: { type: [revisionSchema], select: false },
  },
  // optimisticConcurrency: doctor edit aur pharmacist dispense ek saath ho to ek ko error milta hai,
  // dusre ka kaam chupchaap overwrite nahi hota
  { timestamps: true, optimisticConcurrency: true }
);

reportSchema.index({ appointment: 1 });
reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);