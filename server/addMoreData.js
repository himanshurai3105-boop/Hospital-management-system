const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Room = require("./models/Room");
const Bed = require("./models/Bed");
const Equipment = require("./models/Equipment");

dotenv.config();

// ⚙️ CONFIGURE HERE — kitna data add karna hai
const NUM_DOCTORS_TO_ADD = 70;
const NUM_PATIENTS_TO_ADD = 10;
const NUM_ROOMS_TO_ADD = 10;
const NUM_EQUIPMENT_TO_ADD = 25;

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
  "Ishaan", "Rohan", "Kabir", "Aryan", "Dev", "Yash", "Ananya", "Diya",
  "Saanvi", "Aadhya", "Kiara", "Myra", "Anika", "Riya", "Pari", "Ira",
  "Meera", "Neha", "Priya", "Pooja", "Sneha", "Kavya",
];

const lastNames = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Rao",
  "Mehta", "Joshi", "Nair", "Iyer", "Chopra", "Malhotra", "Kapoor", "Agarwal",
  "Bansal", "Saxena", "Mishra", "Pandey",
];

const specializations = [
  "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dermatology",
  "General Medicine", "ENT", "Gynecology", "Ophthalmology", "Psychiatry",
  "Urology", "Gastroenterology", "Pulmonology", "Nephrology", "Oncology",
];

const equipmentTypes = ["X-Ray", "MRI", "CT Scan", "ECG", "Ultrasound", "Blood Test"];
const equipmentNames = {
  "X-Ray": ["Digital X-Ray Machine", "Portable X-Ray Unit", "Mobile Radiography System"],
  "MRI": ["1.5T MRI Scanner", "3T MRI System", "Open MRI Machine"],
  "CT Scan": ["64-Slice CT Scanner", "128-Slice CT System", "Spiral CT Machine"],
  "ECG": ["12-Lead ECG Machine", "Portable ECG Monitor", "Digital ECG System"],
  "Ultrasound": ["Color Doppler Ultrasound", "Portable Ultrasound Scanner", "4D Ultrasound Machine"],
  "Blood Test": ["Automated Blood Analyzer", "Hematology Analyzer", "Biochemistry Analyzer"],
};
const locations = [
  "Radiology Dept, Floor 1", "Radiology Dept, Floor 2", "ICU Wing, Floor 3",
  "Pathology Lab, Floor 1", "Emergency Ward, Ground Floor", "Cardiology Dept, Floor 2",
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => `${randomFrom(["6", "7", "8", "9"])}${Math.floor(100000000 + Math.random() * 899999999)}`;

const addMoreData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");

    const existingDoctorCount = await User.countDocuments({ role: "doctor" });
    const existingPatientCount = await User.countDocuments({ role: "patient" });
    const existingRoomCount = await Room.countDocuments();

    if (NUM_DOCTORS_TO_ADD > 0) {
      console.log(`Adding ${NUM_DOCTORS_TO_ADD} doctors...`);

for (let i = 0; i < NUM_DOCTORS_TO_ADD; i++) {
  const name = `Dr. ${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
  const emailIndex = existingDoctorCount + i + 1;
  const chosenShift = shiftPattern[i % 5];

  let doctorFees = (Math.floor(Math.random() * 15) + 3) * 100;
  if (chosenShift === "emergency") doctorFees = Math.round(doctorFees * 1.5);

  await User.create({
    name,
    email: `doctor${emailIndex}@citycare.com`,
    password: "Doctor@123",
    role: "doctor",
    phone: randomPhone(),
    specialization: randomFrom(specializations),
    experience: Math.floor(Math.random() * 20) + 1,
    fees: doctorFees,
    shiftType: chosenShift,
    availableDays: ["Mon", "Wed", "Fri"],
    availableTime: "10:00 AM - 4:00 PM",
  });
  if ((i + 1) % 100 === 0) console.log(`  ${i + 1} doctors added so far...`);
}
      console.log(`✅ ${NUM_DOCTORS_TO_ADD} doctors added.`);
    }

    if (NUM_PATIENTS_TO_ADD > 0) {
      console.log(`Adding ${NUM_PATIENTS_TO_ADD} patients...`);
      for (let i = 0; i < NUM_PATIENTS_TO_ADD; i++) {
        const name = `${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
        const emailIndex = existingPatientCount + i + 1;
        await User.create({
          name,
          email: `patient${emailIndex}@citycare.com`,
          password: "Patient@123",
          role: "patient",
          phone: randomPhone(),
          age: Math.floor(Math.random() * 60) + 5,
          gender: randomFrom(["male", "female"]),
          address: `${Math.floor(Math.random() * 200) + 1}, MG Road, Delhi`,
        });
      }
      console.log(`✅ ${NUM_PATIENTS_TO_ADD} patients added.`);
    }

    if (NUM_ROOMS_TO_ADD > 0) {
      console.log(`Adding ${NUM_ROOMS_TO_ADD} rooms...`);
      const roomTypes = ["general", "private", "icu", "deluxe"];
      const bedLetters = "ABCDEFGHIJ";

      for (let i = 1; i <= NUM_ROOMS_TO_ADD; i++) {
        const type = randomFrom(roomTypes);
        const totalBeds = type === "icu" ? 2 : type === "general" ? 6 : 2;
        const roomNumber = `${100 + existingRoomCount + i}`;

        const room = await Room.create({
          roomNumber,
          roomType: type,
          pricePerDay: type === "icu" ? 5000 : type === "deluxe" ? 3000 : type === "private" ? 2000 : 800,
          totalBeds,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} ward`,
        });

        const beds = [];
        for (let b = 0; b < totalBeds; b++) {
          beds.push({ room: room._id, bedNumber: `${roomNumber}-${bedLetters[b]}` });
        }
        await Bed.create(beds);
      }
      console.log(`✅ ${NUM_ROOMS_TO_ADD} rooms added.`);
    }

    if (NUM_EQUIPMENT_TO_ADD > 0) {
      console.log(`Adding ${NUM_EQUIPMENT_TO_ADD} equipment...`);
      for (let i = 0; i < NUM_EQUIPMENT_TO_ADD; i++) {
        const type = randomFrom(equipmentTypes);
        const name = randomFrom(equipmentNames[type]);
        const costMap = { "X-Ray": 500, "MRI": 5000, "CT Scan": 3500, "ECG": 300, "Ultrasound": 800, "Blood Test": 400 };

        await Equipment.create({
          name: `${name} #${i + 1}`,
          type,
          location: randomFrom(locations),
          costPerUse: costMap[type] + Math.floor(Math.random() * 200),
        });
      }
      console.log(`✅ ${NUM_EQUIPMENT_TO_ADD} equipment added.`);
    }

    console.log("\n🎉 All done! No existing data was deleted.");
    process.exit(0);
  } catch (error) {
    console.error("Error adding data:", error);
    process.exit(1);
  }
};

addMoreData();