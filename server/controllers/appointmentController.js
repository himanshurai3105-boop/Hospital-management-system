const Appointment = require("../models/Appointment");
const User = require("../models/User");
const ShiftSettings = require("../models/ShiftSettings");
const { getSessions, getNextSlot, isWithinBookingWindow, getCurrentShiftPeriod, generateAllSlots } = require("../utils/scheduleHelper");

// @route POST /api/appointments
// @desc  Patient books an appointment
exports.bookAppointment = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can book appointments" });
    }

    const { doctorId, date, timeSlot, reason } = req.body;

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      timeSlot,
      reason,
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/appointments/my
// @desc  Patient views their own appointment history
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate("doctor", "name specialization fees")
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/appointments/doctor/today
// @desc  Doctor views today's appointments
exports.getTodayAppointments = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can access this" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("patient", "name email phone age gender")
      .sort({ timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/appointments/:id/status
// @desc  Doctor updates appointment status
// @route PUT /api/appointments/:id/status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can update status" });
    }

    const { status } = req.body;
    const validStatuses = ["pending", "waiting", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const wasConfirmed = appointment.status === "confirmed";
    appointment.status = status;
    await appointment.save();

    // If a confirmed appointment just finished (completed/cancelled), promote the next waiting one
    if (wasConfirmed && ["completed", "cancelled"].includes(status)) {
      const startOfDay = new Date(appointment.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointment.date);
      endOfDay.setHours(23, 59, 59, 999);

      const nextWaiting = await Appointment.findOne({
        doctor: appointment.doctor,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "waiting",
      }).sort({ createdAt: 1 });

      if (nextWaiting) {
        nextWaiting.status = "confirmed";
        await nextWaiting.save();
      }
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/appointments
// @desc  Admin views all appointments
exports.getAllAppointments = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can access this" });
    }

    const appointments = await Appointment.find()
      .populate("patient", "name email phone")
      .populate("doctor", "name specialization")
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/appointments/:id/queue
// @desc  Patient - get queue position & estimated wait time for their appointment
exports.getQueueStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id }).populate(
      "doctor",
      "name avgConsultationTime"
    );

    if (!["confirmed", "waiting"].includes(appointment.status)) {
  return res.json({
    status: appointment.status,
    message:
      appointment.status === "pending"
        ? "Your payment is being processed."
        : `This appointment is already ${appointment.status}.`,
  });
}

    // Same doctor, same date, still waiting, sorted by time slot
    const startOfDay = new Date(appointment.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointment.date);
    endOfDay.setHours(23, 59, 59, 999);

   const queue = await Appointment.find({
    doctor: appointment.doctor._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["confirmed", "waiting"] },
  }).sort({ timeSlot: 1, createdAt: 1 });

    const position = queue.findIndex((a) => a._id.toString() === appointment._id.toString());
    const tokenNumber = position + 1;
    const patientsAhead = position;
    const avgTime = appointment.doctor.avgConsultationTime || 15;
    const estimatedWaitMinutes = patientsAhead * avgTime;

    res.json({
      tokenNumber,
      patientsAhead,
      estimatedWaitMinutes,
      doctorName: appointment.doctor.name,
      timeSlot: appointment.timeSlot,
      status: appointment.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/appointments/book-with-payment
// @desc  Patient - verify payment first, then create the appointment (payment-first flow)
// @route POST /api/appointments/book-with-payment
// @route POST /api/appointments/book-with-payment
    exports.bookAppointmentWithPayment = async (req, res) => {
      try {
        const crypto = require("crypto");
        const { doctorId, reason, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        const settings = await ShiftSettings.getSettings();

        if (!isWithinBookingWindow(settings, doctor.shiftType)) {
          return res.status(400).json({ message: `Booking is currently closed for ${doctor.shiftType} shift doctors.` });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(sign)
          .digest("hex");

        if (expectedSign !== razorpay_signature) {
          return res.status(400).json({ message: "Invalid payment signature. Appointment not created." });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Count how many are already actively counted (confirmed + waiting) for slot-time calc
        const bookedCount = await Appointment.countDocuments({
          doctor: doctor._id,
          date: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ["confirmed", "waiting"] },
        });

        const sessions = getSessions(settings, doctor.shiftType);
        const slot = getNextSlot(sessions, doctor.avgConsultationTime || 15, bookedCount);
        if (!slot) {
          return res.status(400).json({ message: "Doctor got fully booked just now. Payment will be refunded shortly." });
        }

        // Decide confirmed vs waiting based on the 30-slot cap (per doctor, per day)
        const confirmedCount = await Appointment.countDocuments({
          doctor: doctor._id,
          date: { $gte: startOfDay, $lte: endOfDay },
          status: "confirmed",
        });
        const finalStatus = confirmedCount < 30 ? "confirmed" : "waiting";

        const appointment = await Appointment.create({
          patient: req.user._id,
          doctor: doctorId,
          date: new Date(),
          timeSlot: slot.timeSlot,
          reason,
          status: finalStatus,
          paymentStatus: "paid",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @route GET /api/appointments/availability/:doctorId
// @desc  Patient - check if booking is open, and get the slot/token they'd be assigned
exports.checkAvailability = async (req, res) => {
  try {
    const ShiftSettings = require("../models/ShiftSettings");
    const { getSessions, getNextSlot, isWithinBookingWindow } = require("../utils/scheduleHelper");
    const User = require("../models/User");

    const doctor = await User.findOne({ _id: req.params.doctorId, role: "doctor" });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

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
      status: { $in: ["pending", "confirmed"] },
    });

    const sessions = getSessions(settings, doctor.shiftType);
    const slot = getNextSlot(sessions, doctor.avgConsultationTime || 15, bookedCount);
    if (!slot) {
      return res.status(400).json({ message: "Doctor is fully booked for today." });
    }

    res.json({ tokenNumber: bookedCount + 1, timeSlot: slot.timeSlot, session: slot.session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/appointments/scheduled/availability/:doctorId?date=YYYY-MM-DD
// @desc  Patient - see available time slots for a scheduled-type doctor on a specific date
exports.getScheduledAvailability = async (req, res) => {
  try {
    const { generateAllSlots } = require("../utils/scheduleHelper");
    const doctor = await User.findOne({ _id: req.params.doctorId, role: "doctor" });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (doctor.bookingType !== "scheduled") {
      return res.status(400).json({ message: "This doctor does not use calendar-based booking." });
    }

    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 15);

    if (requestedDate < today || requestedDate > maxDate) {
      return res.status(400).json({ message: "Date must be within the next 15 days." });
    }

    const settings = await ShiftSettings.getSettings();
    const allSlots = generateAllSlots(settings.daySessions, doctor.avgConsultationTime || 15);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    }).select("timeSlot");

    const bookedSlots = new Set(bookedAppointments.map((a) => a.timeSlot));

    const slotsWithStatus = allSlots.map((slot) => ({
      timeSlot: slot,
      available: !bookedSlots.has(slot),
    }));

    const hasAnyAvailable = slotsWithStatus.some((s) => s.available);

    res.json({ slots: slotsWithStatus, hasAnyAvailable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/appointments/scheduled/overview/:doctorId
// @desc  Patient - quick overview of next 15 days showing which have availability (for calendar highlighting)
exports.getScheduledOverview = async (req, res) => {
  try {
    const { generateAllSlots } = require("../utils/scheduleHelper");
    const doctor = await User.findOne({ _id: req.params.doctorId, role: "doctor" });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const settings = await ShiftSettings.getSettings();
    const allSlots = generateAllSlots(settings.daySessions, doctor.avgConsultationTime || 15);
    const totalSlotsPerDay = allSlots.length;

    const overview = [];
    for (let i = 0; i < 15; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      const startOfDay = new Date(day);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);

      const bookedCount = await Appointment.countDocuments({
        doctor: doctor._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["pending", "confirmed"] },
      });

      overview.push({
        date: startOfDay.toISOString().split("T")[0],
        availableSlots: Math.max(0, totalSlotsPerDay - bookedCount),
        totalSlots: totalSlotsPerDay,
      });
    }

    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/appointments/scheduled/book-with-payment
// @desc  Patient - book a specific date+time slot with a scheduled-type doctor
exports.bookScheduledWithPayment = async (req, res) => {
  try {
    const crypto = require("crypto");
    const { doctorId, date, timeSlot, reason, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (doctor.bookingType !== "scheduled") {
      return res.status(400).json({ message: "This doctor does not use calendar-based booking." });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature. Appointment not created." });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Re-check the slot is still free (prevents double-booking / race condition)
    const clash = await Appointment.findOne({
      doctor: doctor._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });

    if (clash) {
      return res.status(400).json({ message: "This slot was just booked by someone else. Payment will be refunded shortly." });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date: startOfDay,
      timeSlot,
      reason,
      status: "confirmed", // scheduled bookings are always directly confirmed (slot-based, no queue)
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};