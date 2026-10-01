const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Report = require("../models/Report");
const RoomBooking = require("../models/RoomBooking");

// @route GET /api/doctors
// @desc  Get all doctors (public - for patients to browse)
exports.getAllDoctors = async (req, res) => {
  try {
    const Feedback = require("../models/Feedback");
    const Appointment = require("../models/Appointment");
    const { getCurrentShiftPeriod } = require("../utils/scheduleHelper");

    const filter = { role: "doctor", isActive: true };

    // When fetching for the booking page, only show doctors matching current period + emergency doctors
      if (req.query.forBooking === "true") {
      const ShiftSettings = require("../models/ShiftSettings");
      const { getCurrentShiftPeriod } = require("../utils/scheduleHelper");
      const settings = await ShiftSettings.getSettings();
      const currentPeriod = getCurrentShiftPeriod(settings);
      filter.shiftType = { $in: [currentPeriod, "emergency"] };
    }

    const doctors = await User.find(filter).select("-password").lean();

    const ratings = await Feedback.aggregate([
      { $group: { _id: "$doctor", avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    ]);
    const ratingsMap = {};
    ratings.forEach((r) => {
      ratingsMap[r._id.toString()] = {
        avgRating: Math.round(r.avgRating * 10) / 10,
        totalReviews: r.totalReviews,
      };
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCounts = await Appointment.aggregate([
      { $match: { date: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: "cancelled" } } },
      { $group: { _id: "$doctor", count: { $sum: 1 } } },
    ]);
    const todayCountsMap = {};
    todayCounts.forEach((t) => {
      todayCountsMap[t._id.toString()] = t.count;
    });

    const doctorsWithExtras = doctors.map((doc) => ({
      ...doc,
      avgRating: ratingsMap[doc._id.toString()]?.avgRating || 0,
      totalReviews: ratingsMap[doc._id.toString()]?.totalReviews || 0,
      todayBooked: todayCountsMap[doc._id.toString()] || 0,
      dailyCapacity: doc.dailyCapacity || 50,
    }));

    res.json(doctorsWithExtras);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/doctors/my-patients
// @desc  Doctor - list of unique patients they have treated
exports.getMyPatients = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id }).populate(
      "patient",
      "name email phone age gender hospitalId"
    );

    const uniquePatients = {};
    appointments.forEach((appt) => {
      if (appt.patient) uniquePatients[appt.patient._id] = appt.patient;
    });

    let patients = Object.values(uniquePatients);

    const { search } = req.query;
    if (search) {
      const term = search.toLowerCase();
      patients = patients.filter(
        (p) => p.name?.toLowerCase().includes(term) || p.hospitalId?.toLowerCase().includes(term)
      );
    }

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/doctors/patients/:patientId/profile
// @desc  Doctor - full medical history of a patient they have treated
exports.getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;

    const hasAccess = await Appointment.findOne({ doctor: req.user._id, patient: patientId });
    if (!hasAccess) {
      return res.status(403).json({ message: "You don't have access to this patient's records" });
    }

    const patient = await User.findOne({ _id: patientId, role: "patient" }).select("-password");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const appointments = await Appointment.find({ patient: patientId })
      .populate("doctor", "name specialization fees")
      .sort({ date: -1 });

    const reports = await Report.find({ patient: patientId })
      .populate("doctor", "name specialization")
      .populate("prescribedMedicines.medicine", "name price")
      .sort({ createdAt: -1 });

    const roomBookings = await RoomBooking.find({ patient: patientId })
      .populate("room")
      .populate("bed")
      .sort({ createdAt: -1 });

    const CheckupRecord = require("../models/CheckupRecord");
    const checkups = await CheckupRecord.find({ patient: patientId })
      .populate("doctor", "name specialization")
      .populate("equipment", "name type costPerUse")
      .sort({ scheduledDate: -1 });

    const nextAppointment = appointments
      .filter((a) => ["confirmed", "waiting", "pending"].includes(a.status) && new Date(a.date) >= new Date().setHours(0, 0, 0, 0))
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;

    const nextCheckup = checkups
      .filter((c) => c.status === "scheduled" && new Date(c.scheduledDate) >= new Date().setHours(0, 0, 0, 0))
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0] || null;

    const totalFeesPaid = appointments
      .filter((a) => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + (a.doctor?.fees || 0), 0);

    res.json({ patient, appointments, reports, roomBookings, checkups, nextAppointment, nextCheckup, totalFeesPaid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @route GET /api/doctors/:id
// @desc  Get single doctor by id
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: "doctor" }).select("-password");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/doctors/profile
// @desc  Doctor updates their own profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can update this profile" });
    }

    const allowedFields = [
      "name",
      "phone",
      "specialization",
      "experience",
      "fees",
      "availableDays",
      "availableTime",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const doctor = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};