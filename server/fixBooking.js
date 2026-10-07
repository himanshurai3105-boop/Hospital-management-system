require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const { getBookingType } = require("./utils/bookingTypeHelper");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // bookingType missing ya null wale doctors
  const docs = await User.collection
    .find({ role: "doctor", bookingType: null })
    .toArray();

  console.log("Fix karne hain:", docs.length, "doctors");

  const ops = docs.map((d) => ({
    updateOne: {
      filter: { _id: d._id },
      update: { $set: { bookingType: getBookingType(d.specialization, d.shiftType || "day") } },
    },
  }));

  if (ops.length) {
    const result = await User.collection.bulkWrite(ops);
    console.log("Updated:", result.modifiedCount);
  }

  const after = await User.collection
    .aggregate([
      { $match: { role: "doctor" } },
      { $group: { _id: { $ifNull: ["$bookingType", "MISSING"] }, count: { $sum: 1 } } },
    ])
    .toArray();
  console.log("Ab ka status:", after);

  process.exit(0);
})();