require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await User.collection
    .aggregate([
      { $match: { role: "doctor" } },
      { $group: { _id: { $ifNull: ["$bookingType", "MISSING"] }, count: { $sum: 1 } } },
    ])
    .toArray();
  console.log(res);
  process.exit(0);
})();