const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

// ⚙️ Adjust these if your total doctor count changes
const DAY_COUNT = 23;
const NIGHT_COUNT = 23;
const EMERGENCY_COUNT = 14;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");

    const doctors = await User.find({ role: "doctor" }).sort({ createdAt: 1 });
    const total = DAY_COUNT + NIGHT_COUNT + EMERGENCY_COUNT;

    if (doctors.length < total) {
      console.log(`⚠️ Only ${doctors.length} doctors found, need ${total}. Proceeding with what's available.`);
    }

    let updated = 0;
    for (let i = 0; i < doctors.length; i++) {
      const doc = doctors[i];
      let shiftType;
      let isEmergency = false;

      if (i < DAY_COUNT) {
        shiftType = "day";
      } else if (i < DAY_COUNT + NIGHT_COUNT) {
        shiftType = "night";
      } else if (i < DAY_COUNT + NIGHT_COUNT + EMERGENCY_COUNT) {
        shiftType = "emergency";
        isEmergency = true;
      } else {
        // extra doctors beyond the target total default to day
        shiftType = "day";
      }

      // Reset fee to base value first (in case script runs multiple times), then apply emergency markup
      const baseFee = doc._originalFees || doc.fees || 500;
      doc.shiftType = shiftType;
      if (isEmergency) {
        doc.fees = Math.round(baseFee * 1.5);
      }

      await doc.save();
      updated++;
    }

    const finalCounts = await User.aggregate([
      { $match: { role: "doctor" } },
      { $group: { _id: "$shiftType", count: { $sum: 1 } } },
    ]);

    console.log(`✅ Updated shiftType for ${updated} doctors.`);
    console.log("Final distribution:", finalCounts);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();