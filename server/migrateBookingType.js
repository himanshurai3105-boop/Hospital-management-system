const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const { getBookingType } = require("./utils/bookingTypeHelper");

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");

    const doctors = await User.find({ role: "doctor" });
    let updated = 0;

    for (const doc of doctors) {
      const newType = getBookingType(doc.specialization, doc.shiftType);
      if (doc.bookingType !== newType) {
        doc.bookingType = newType;
        await doc.save();
        updated++;
      }
    }

    const counts = await User.aggregate([
      { $match: { role: "doctor" } },
      { $group: { _id: "$bookingType", count: { $sum: 1 } } },
    ]);

    console.log(`✅ Updated bookingType for ${updated} doctors.`);
    console.log("Distribution:", counts);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();