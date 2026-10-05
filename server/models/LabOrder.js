const mongoose = require("mongoose");
const { LAB_CATEGORY_KEYS } = require("../utils/labCategories");

const ObjectId = mongoose.Schema.Types.ObjectId;

const valueSchema = new mongoose.Schema(
  {
    name: String,
    value: String,
    unit: String,
    refMin: Number,
    refMax: Number,
    refText: String,
    flag: { type: String, enum: ["", "normal", "low", "high", "abnormal"], default: "" },
  },
  { _id: false }
);

// Submit ke baad koi badlav ho to purani value yahan jama hoti hai (chupchaap edit nahi)
const amendmentSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: ObjectId, ref: "User" },
    reason: String,
    previousValues: [valueSchema],
    previousRemarks: String,
  },
  { _id: false }
);

const labOrderSchema = new mongoose.Schema(
  {
    report: { type: ObjectId, ref: "Report", required: true },
    patient: { type: ObjectId, ref: "User", required: true },
    doctor: { type: ObjectId, ref: "User", required: true },
    appointment: { type: ObjectId, ref: "Appointment" },

    test: { type: ObjectId, ref: "LabTest", required: true },
    testName: { type: String, required: true },                         // snapshot
    category: { type: String, enum: LAB_CATEGORY_KEYS, required: true }, // snapshot, routing ke liye
    instructions: { type: String, maxlength: 500 },
    priority: { type: String, enum: ["routine", "urgent"], default: "routine" },

    status: {
      type: String,
      enum: ["ordered", "sample_collected", "completed", "cancelled"],
      default: "ordered",
    },
    sampleId: { type: String },
    sampleCollectedAt: { type: Date },
    sampleCollectedBy: { type: ObjectId, ref: "User" },

    result: {
      values: { type: [valueSchema], default: [] },
      remarks: { type: String },
      attachmentFileId: { type: ObjectId },   // optional scan/image (MongoDB GridFS), baad mein
      attachmentName: { type: String },
      attachmentType: { type: String },
      submittedBy: { type: ObjectId, ref: "User" },
      submittedAt: { type: Date },
      amendments: { type: [amendmentSchema], default: [] },
    },
  },
  { timestamps: true }
);

labOrderSchema.index({ category: 1, status: 1, createdAt: -1 });
labOrderSchema.index({ patient: 1, createdAt: -1 });
labOrderSchema.index({ doctor: 1, createdAt: -1 });
labOrderSchema.index({ report: 1 });

module.exports = mongoose.model("LabOrder", labOrderSchema);
