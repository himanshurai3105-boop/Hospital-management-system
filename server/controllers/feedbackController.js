const Feedback = require("../models/Feedback");
const Appointment = require("../models/Appointment");

// @route POST /api/feedback
// @desc  Patient - submit feedback for a completed appointment
exports.submitFeedback = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({ message: "You can only review completed appointments" });
    }

    const existing = await Feedback.findOne({ appointment: appointmentId });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this appointment" });
    }

    const feedback = await Feedback.create({
      patient: req.user._id,
      doctor: appointment.doctor,
      appointment: appointmentId,
      rating,
      comment,
    });

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/feedback/doctor/:doctorId
// @desc  Public - view all feedback for a doctor
exports.getDoctorFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ doctor: req.params.doctorId })
      .populate("patient", "name")
      .sort({ createdAt: -1 });

    const validFeedback = feedback.filter((f) => f.patient);

    const avgRating =
      validFeedback.length > 0
        ? (validFeedback.reduce((sum, f) => sum + f.rating, 0) / validFeedback.length).toFixed(1)
        : 0;

    res.json({ feedback: validFeedback, avgRating, totalReviews: validFeedback.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/feedback/my
// @desc  Patient - view their own submitted feedback
exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ patient: req.user._id })
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/feedback/pending
// @desc  Patient - completed appointments that don't have feedback yet
exports.getPendingFeedback = async (req, res) => {
  try {
    const completedAppointments = await Appointment.find({
      patient: req.user._id,
      status: "completed",
    }).populate("doctor", "name specialization");

    const existingFeedback = await Feedback.find({ patient: req.user._id }).select("appointment");
    const reviewedAppointmentIds = existingFeedback.map((f) => f.appointment.toString());

    const pending = completedAppointments.filter(
      (appt) => !reviewedAppointmentIds.includes(appt._id.toString())
    );

    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/feedback/recent
// @desc  Public - recent top-rated reviews for homepage/testimonials
exports.getRecentFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ rating: { $gte: 4 } })
      .populate("patient", "name")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 })
      .limit(10);

    const validFeedback = feedback.filter((f) => f.patient && f.doctor).slice(0, 6);

    res.json(validFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};