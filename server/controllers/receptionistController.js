const User = require("../models/User");
const Appointment = require("../models/Appointment");
const ShiftSettings = require("../models/ShiftSettings");
const { getSessions, getNextSlot, isWithinBookingWindow } = require("../utils/scheduleHelper");

// @route GET /api/receptionist/patients/search?q=
// @desc  Receptionist - search existing patients by name/hospitalId/phone
exports.searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const patients = await User.find({
      role: "patient",
      $or: [
        { name: { $regex: q, $options: "i" } },
        { hospitalId: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    }).select("-password").limit(10);

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/receptionist/patients/register
// @desc  Receptionist - register a new walk-in patient
exports.registerWalkInPatient = async (req, res) => {
  try {
    const { name, email, phone, age, gender, address, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "A patient with this email already exists" });

    const patient = await User.create({
      name,
      email,
      password: password || "Patient@123", // default password for walk-ins, patient can change later
      phone,
      age,
      gender,
      address,
      role: "patient",
    });

    res.status(201).json({
      _id: patient._id,
      hospitalId: patient.hospitalId,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/receptionist/doctors
// @desc  Receptionist - list all active doctors (for booking)
exports.getDoctorsForBooking = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor", isActive: true }).select("-password");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/receptionist/appointments/book
// @desc  Receptionist - book a queue-type appointment for a patient (cash or marks pending for online)
exports.bookAppointmentForPatient = async (req, res) => {
  try {
    const { patientId, doctorId, reason, paymentMethod } = req.body; // paymentMethod: "cash" or "online"

    const patient = await User.findOne({ _id: patientId, role: "patient" });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.bookingType === "scheduled") {
      return res.status(400).json({ message: "Use the calendar booking endpoint for this doctor." });
    }

    const settings = await ShiftSettings.getSettings();
    if (!isWithinBookingWindow(settings, doctor.shiftType)) {
      return res.status(400).json({ message: `Booking is currently closed for ${doctor.shiftType} shift doctors.` });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bookedCount = await Appointment.countDocuments({
      doctor: doctor._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["confirmed", "waiting"] },
    });

    const sessions = getSessions(settings, doctor.shiftType);
    const slot = getNextSlot(sessions, doctor.avgConsultationTime || 15, bookedCount);
    if (!slot) return res.status(400).json({ message: "Doctor is fully booked for today." });

    if (paymentMethod === "cash") {
      // Cash collected in person right now — treat as paid immediately
      const confirmedCount = await Appointment.countDocuments({
        doctor: doctor._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "confirmed",
      });
      const finalStatus = confirmedCount < 30 ? "confirmed" : "waiting";

      const appointment = await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        date: new Date(),
        timeSlot: slot.timeSlot,
        reason,
        status: finalStatus,
        paymentStatus: "paid",
        paymentMethod: "cash",
      });

      return res.status(201).json({ appointment, message: "Cash payment recorded. Appointment booked." });
    }

    // Online — appointment stays "pending" until the patient/receptionist completes payment via Razorpay
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date(),
      timeSlot: slot.timeSlot,
      reason,
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: "online",
    });

    res.status(201).json({ appointment, message: "Appointment created. Complete online payment to confirm." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/receptionist/appointments/:id/verify-online-payment
// @desc  Receptionist - verify Razorpay payment for a pending appointment they created
exports.verifyReceptionistPayment = async (req, res) => {
  try {
    const crypto = require("crypto");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const startOfDay = new Date(appointment.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointment.date);
    endOfDay.setHours(23, 59, 59, 999);

    const confirmedCount = await Appointment.countDocuments({
      doctor: appointment.doctor,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "confirmed",
    });

    appointment.status = confirmedCount < 30 ? "confirmed" : "waiting";
    appointment.paymentStatus = "paid";
    appointment.razorpayOrderId = razorpay_order_id;
    appointment.razorpayPaymentId = razorpay_payment_id;
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/receptionist/appointments/today
// @desc  Receptionist - view all of today's appointments across all doctors
exports.getTodayAllAppointments = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({ date: { $gte: startOfDay, $lte: endOfDay } })
      .populate("patient", "name hospitalId phone")
      .populate("doctor", "name specialization fees")
      .sort({ timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/admin/receptionists
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

// @route GET /api/admin/receptionists
exports.getAllReceptionists = async (req, res) => {
  try {
    const receptionists = await User.find({ role: "receptionist" }).select("-password");
    res.json(receptionists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/admin/receptionists/:id/toggle-status
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

// @route DELETE /api/admin/receptionists/:id
exports.deleteReceptionist = async (req, res) => {
  try {
    const receptionist = await User.findOneAndDelete({ _id: req.params.id, role: "receptionist" });
    if (!receptionist) return res.status(404).json({ message: "Receptionist not found" });
    res.json({ message: "Receptionist removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};