const cron = require("node-cron");
const Razorpay = require("razorpay");
const Appointment = require("../models/Appointment");
const S = require("../utils/slotTime");

const MAX_CARRY_DAYS = 3; // queue booking itne din se zyada carry nahi hogi

const cancelAndRefund = async (razorpay, appt, reason) => {
  appt.status = "cancelled";
  appt.cancelReason = reason;

  if (appt.paymentStatus === "paid" && appt.razorpayPaymentId) {
    try {
      const refund = await razorpay.payments.refund(appt.razorpayPaymentId, {});
      appt.paymentStatus = "refunded";
      appt.razorpayRefundId = refund.id;
      if (appt.amountPaid != null) appt.refundAmount = appt.amountPaid;
      console.log(`✅ Refunded appointment ${appt._id} — Refund ID: ${refund.id}`);
    } catch (refundError) {
      appt.paymentStatus = "refund_pending";
      console.error(`❌ Refund failed for appointment ${appt._id}:`, refundError.message);
    }
  }
  await appt.save();
};

const autoCancelUnattendedAppointments = async () => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const today = S.getTodayStr();
    const startOfToday = S.dayRange(today).start; // IST midnight

    // 1. Special (calendar) aur purani bookings: date nikal gayi, doctor ne nahi dekha.
    //    Naye queue bookings (queueDate wali) yahan nahi aate, unhe queueRollover sambhalta hai.
    const overdue = await Appointment.find({
      $or: [{ bookingType: { $ne: "queue" } }, { queueDate: { $exists: false } }],
      date: { $lt: startOfToday },
      status: { $in: ["pending", "confirmed"] },
    });
    for (const appt of overdue) {
      await cancelAndRefund(razorpay, appt, "Doctor did not attend the appointment on the scheduled date");
    }

    // 2. Naye queue bookings jo MAX_CARRY_DAYS se zyada din se carry ho rahi hain
    const oldestAllowed = S.addDays(today, -MAX_CARRY_DAYS);
    const stale = await Appointment.find({
      bookingType: "queue",
      queueDate: { $exists: true },
      status: "confirmed",
      priorityDate: { $lt: oldestAllowed },
    });
    for (const appt of stale) {
      await cancelAndRefund(razorpay, appt, `Not seen within ${MAX_CARRY_DAYS} days, cancelled with full refund`);
    }

    const total = overdue.length + stale.length;
    if (total > 0) console.log(`🔄 Auto-cancelled ${total} unattended appointment(s).`);
  } catch (error) {
    console.error("Error in autoCancelUnattendedAppointments job:", error.message);
  }
};

const startAutoCancelJob = () => {
  cron.schedule("0 * * * *", () => {
    console.log("Running auto-cancel job for unattended appointments...");
    autoCancelUnattendedAppointments();
  });

  console.log("✅ Auto-cancel appointment job scheduled (runs every hour).");
};

module.exports = { startAutoCancelJob, autoCancelUnattendedAppointments };