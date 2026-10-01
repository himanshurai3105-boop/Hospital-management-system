const Report = require("../models/Report");
const Appointment = require("../models/Appointment");

// @route POST /api/reports
// @desc  Doctor creates a report for a patient (with prescribed medicines)
exports.createReport = async (req, res) => {
  try {
    const { appointmentId, diagnosis, prescription, notes, prescribedMedicines } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not yours" });
    }

    const report = await Report.create({
      patient: appointment.patient,
      doctor: req.user._id,
      appointment: appointmentId,
      diagnosis,
      prescription,
      notes,
      prescribedMedicines: prescribedMedicines || [],
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/reports/doctor/appointments
exports.getDoctorAppointmentsForReport = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate("patient", "name email")
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/reports/doctor/my-reports
exports.getDoctorReports = async (req, res) => {
  try {
    const reports = await Report.find({ doctor: req.user._id })
      .populate("patient", "name email")
      .populate("prescribedMedicines.medicine", "name price")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/reports/my
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ patient: req.user._id })
      .populate("doctor", "name specialization")
      .populate("prescribedMedicines.medicine", "name price")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/reports/:reportId/medicine/:itemId/status
// @desc  Patient - mark a prescribed medicine as taken/pending
exports.updateMedicineStatus = async (req, res) => {
  try {
    const { status } = req.body; // "taken" or "pending"
    const report = await Report.findOne({ _id: req.params.reportId, patient: req.user._id });
    if (!report) return res.status(404).json({ message: "Report not found" });

    const item = report.prescribedMedicines.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Medicine item not found" });

    item.status = status;
    await report.save();

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};