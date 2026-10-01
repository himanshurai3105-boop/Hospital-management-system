const cron = require("node-cron");
const Razorpay = require("razorpay");
const Appointment = require("../models/Appointment");

const autoCancelUnattendedAppointments = async () => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const overdueAppointments = await Appointment.find({
      date: { $lt: startOfToday },
      status: { $in: ["pending", "confirmed"] },
    });

    for (const appt of overdueAppointments) {
      appt.status = "cancelled";
      appt.cancelReason = "Doctor did not attend the appointment on the scheduled date";

      if (appt.paymentStatus === "paid" && appt.razorpayPaymentId) {
        try {
          const refund = await razorpay.payments.refund(appt.razorpayPaymentId, {});
          appt.paymentStatus = "refunded";
          appt.razorpayRefundId = refund.id;
          console.log(`✅ Refunded appointment ${appt._id} — Refund ID: ${refund.id}`);
        } catch (refundError) {
          appt.paymentStatus = "refund_pending";
          console.error(`❌ Refund failed for appointment ${appt._id}:`, refundError.message);
        }
      }

      await appt.save();
    }

    if (overdueAppointments.length > 0) {
      console.log(`🔄 Auto-cancelled ${overdueAppointments.length} unattended appointment(s).`);
    }
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