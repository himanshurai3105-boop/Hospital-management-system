const { LAB_CATEGORY_KEYS } = require("../utils/labCategories");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const MedicineOrder = require("../models/MedicineOrder");
const Bed = require("../models/Bed");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalAppointments = await Appointment.countDocuments();

    res.json({ totalDoctors, totalPatients, totalAppointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const appointmentsByDay = await Appointment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const doctorsBySpecialization = await User.aggregate([
      { $match: { role: "doctor" } },
      { $group: { _id: "$specialization", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const medicineRevenue = await MedicineOrder.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalBeds = await Bed.countDocuments();
    const occupiedBeds = await Bed.countDocuments({ status: "occupied" });

    const genderDistribution = await User.aggregate([
      { $match: { role: "patient" } },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    res.json({
      appointmentsByDay,
      appointmentsByStatus,
      doctorsBySpecialization,
      medicineRevenue: medicineRevenue[0]?.total || 0,
      roomOccupancy: { totalBeds, occupiedBeds, availableBeds: totalBeds - occupiedBeds },
      genderDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllDoctorsAdmin = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addDoctor = async (req, res) => {
  try {
    const { name, email, password, phone, specialization, experience, fees, availableDays, availableTime, shiftType } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    let finalShiftType = shiftType;

    if (!finalShiftType) {
      const counts = await User.aggregate([
        { $match: { role: "doctor" } },
        { $group: { _id: "$shiftType", count: { $sum: 1 } } },
      ]);
      const countMap = { day: 0, night: 0, emergency: 0 };
      counts.forEach((c) => {
        if (c._id) countMap[c._id] = c.count;
      });

      const total = countMap.day + countMap.night + countMap.emergency;
      const targets = { day: total * 0.4, night: total * 0.4, emergency: total * 0.2 };

      finalShiftType = Object.keys(targets).reduce((furthest, key) => {
        const deficit = targets[key] - countMap[key];
        const furthestDeficit = targets[furthest] - countMap[furthest];
        return deficit > furthestDeficit ? key : furthest;
      }, "day");
    }

    let finalFees = fees;
    if (finalShiftType === "emergency" && fees) {
      finalFees = Math.round(fees * 1.5);
    }

    const doctor = await User.create({
      name,
      email,
      password,
      phone,
      role: "doctor",
      specialization,
      experience,
      fees: finalFees,
      shiftType: finalShiftType,
      availableDays,
      availableTime,
    });

    res.status(201).json({
      _id: doctor._id,
      hospitalId: doctor.hospitalId,
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      specialization: doctor.specialization,
      shiftType: doctor.shiftType,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const allowedFields = [
      "name",
      "phone",
      "specialization",
      "experience",
      "fees",
      "shiftType",
      "availableDays",
      "availableTime",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) doctor[field] = req.body[field];
    });

    await doctor.save();
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    res.json({
      message: `Doctor ${doctor.isActive ? "reactivated" : "deactivated"} successfully`,
      isActive: doctor.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await User.findOneAndDelete({ _id: req.params.id, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json({ message: "Doctor permanently removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filter = { role: "patient" };

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { hospitalId: rx }, { email: rx }];
    }

    const patients = await User.find(filter).select("-password");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.triggerAutoCancelJob = async (req, res) => {
  try {
    const { autoCancelUnattendedAppointments } = require("../jobs/autoCancelAppointments");
    await autoCancelUnattendedAppointments();
    res.json({ message: "Auto-cancel job executed. Check appointments for updates." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPatientFullRecord = async (req, res) => {
  try {
    const Report = require("../models/Report");
    const RoomBooking = require("../models/RoomBooking");
    const CheckupRecord = require("../models/CheckupRecord");

    const patient = await User.findOne({ _id: req.params.id, role: "patient" }).select("-password");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const appointments = await Appointment.find({ patient: patient._id })
      .populate("doctor", "name specialization fees")
      .sort({ date: -1 });

    const reports = await Report.find({ patient: patient._id })
      .populate("doctor", "name specialization")
      .populate("prescribedMedicines.medicine", "name price")
      .sort({ createdAt: -1 });

    const roomBookings = await RoomBooking.find({ patient: patient._id })
      .populate("room")
      .populate("bed")
      .sort({ createdAt: -1 });

    const checkups = await CheckupRecord.find({ patient: patient._id })
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

// Receptionist management

exports.addReceptionist = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User with this email already exists" });

    const receptionist = await User.create({ name, email, password, phone, role: "receptionist" });
    res.status(201).json({
      _id: receptionist._id,
      hospitalId: receptionist.hospitalId,
      name: receptionist.name,
      email: receptionist.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReceptionists = async (req, res) => {
  try {
    const receptionists = await User.find({ role: "receptionist" }).select("-password");
    res.json(receptionists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleReceptionistStatus = async (req, res) => {
  try {
    const receptionist = await User.findOne({ _id: req.params.id, role: "receptionist" });
    if (!receptionist) return res.status(404).json({ message: "Receptionist not found" });

    receptionist.isActive = !receptionist.isActive;
    await receptionist.save();
    res.json({ message: `Receptionist ${receptionist.isActive ? "reactivated" : "deactivated"}`, isActive: receptionist.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReceptionist = async (req, res) => {
  try {
    const receptionist = await User.findOneAndDelete({ _id: req.params.id, role: "receptionist" });
    if (!receptionist) return res.status(404).json({ message: "Receptionist not found" });
    res.json({ message: "Receptionist removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Staff management

exports.addStaff = async (req, res) => {
  try {
    const { name, email, password, phone, staffType, baseSalary, labSpecialization } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User with this email already exists" });

    const isLab = staffType === "lab_technician";
    if (isLab && !LAB_CATEGORY_KEYS.includes(labSpecialization)) {
      return res.status(400).json({ message: "Select a lab specialization for the Lab Technician" });
    }

    const staff = await User.create({
      name, email, password, phone, staffType, baseSalary, role: "staff",
      ...(isLab ? { labSpecialization } : {}),
    });
    res.status(201).json({
      _id: staff._id,
      hospitalId: staff.hospitalId,
      name: staff.name,
      email: staff.email,
      staffType: staff.staffType,
      labSpecialization: staff.labSpecialization,
    });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("-password");
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: "staff" });
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

    // Type aur specialization pehle jaanch lo, phir badlo
    const nextType = req.body.staffType !== undefined ? req.body.staffType : staff.staffType;
    let nextSpec;
    if (nextType === "lab_technician") {
      nextSpec = req.body.labSpecialization !== undefined ? req.body.labSpecialization : staff.labSpecialization;
      if (!LAB_CATEGORY_KEYS.includes(nextSpec)) {
        return res.status(400).json({ message: "Select a lab specialization for the Lab Technician" });
      }
    }

    ["name", "phone", "staffType", "baseSalary"].forEach((field) => {
      if (req.body[field] !== undefined) staff[field] = req.body[field];
    });
    staff.labSpecialization = nextSpec; // lab technician nahi raha to hat jaayega

    await staff.save();
    res.json(staff);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

exports.toggleStaffStatus = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: "staff" });
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

    staff.isActive = !staff.isActive;
    await staff.save();
    res.json({ message: `Staff ${staff.isActive ? "reactivated" : "deactivated"}`, isActive: staff.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({ _id: req.params.id, role: "staff" });
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    res.json({ message: "Staff member removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};