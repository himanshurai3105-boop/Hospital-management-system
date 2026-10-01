const Equipment = require("../models/Equipment");
const CheckupRecord = require("../models/CheckupRecord");

// @route GET /api/equipment
// @desc  View all equipment (public-ish, used by doctors/admin)
exports.getAllEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/equipment
// @desc  Admin - add new equipment/machine
exports.addEquipment = async (req, res) => {
  try {
    const { name, type, location, costPerUse } = req.body;
    const equipment = await Equipment.create({ name, type, location, costPerUse });
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/equipment/:id
// @desc  Admin - edit equipment
exports.editEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: "Equipment not found" });

    const allowedFields = ["name", "type", "location", "status", "costPerUse"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) equipment[field] = req.body[field];
    });

    await equipment.save();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/equipment/:id
// @desc  Admin - delete equipment
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) return res.status(404).json({ message: "Equipment not found" });
    res.json({ message: "Equipment removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/equipment/checkup
// @desc  Doctor - schedule a checkup/test for a patient
exports.scheduleCheckup = async (req, res) => {
  try {
    const { patientId, equipmentId, scheduledDate } = req.body;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return res.status(404).json({ message: "Equipment not found" });
    if (equipment.status !== "available") {
      return res.status(400).json({ message: "This equipment is currently unavailable" });
    }

    const checkup = await CheckupRecord.create({
      patient: patientId,
      doctor: req.user._id,
      equipment: equipmentId,
      scheduledDate,
    });

    equipment.status = "in-use";
    await equipment.save();

    res.status(201).json(checkup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/equipment/checkup/:id/complete
// @desc  Doctor - mark checkup as completed with result notes (frees the equipment)
exports.completeCheckup = async (req, res) => {
  try {
    const { resultNotes } = req.body;
    const checkup = await CheckupRecord.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!checkup) return res.status(404).json({ message: "Checkup record not found" });

    checkup.status = "completed";
    checkup.resultNotes = resultNotes;
    await checkup.save();

    await Equipment.findByIdAndUpdate(checkup.equipment, { status: "available" });

    res.json(checkup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/equipment/doctor/checkups
// @desc  Doctor - list checkups they scheduled
exports.getDoctorCheckups = async (req, res) => {
  try {
    const checkups = await CheckupRecord.find({ doctor: req.user._id })
      .populate("patient", "name email phone")
      .populate("equipment", "name type")
      .sort({ scheduledDate: -1 });
    res.json(checkups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/equipment/my-checkups
// @desc  Patient - view their own checkups
exports.getMyCheckups = async (req, res) => {
  try {
    const checkups = await CheckupRecord.find({ patient: req.user._id })
      .populate("doctor", "name specialization")
      .populate("equipment", "name type costPerUse")
      .sort({ scheduledDate: -1 });
    res.json(checkups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/equipment/checkups/all
// @desc  Admin - view all checkups
exports.getAllCheckups = async (req, res) => {
  try {
    const checkups = await CheckupRecord.find()
      .populate("patient", "name email")
      .populate("doctor", "name specialization")
      .populate("equipment", "name type")
      .sort({ scheduledDate: -1 });
    res.json(checkups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};