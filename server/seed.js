const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Room = require("./models/Room");
const Bed = require("./models/Bed");
const Medicine = require("./models/Medicine");

dotenv.config();

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

const medicinesData = [
  { name: "Paracetamol", category: "Pain Relief", manufacturer: "Cipla", price: 20, stock: 500 },
  { name: "Amoxicillin", category: "Antibiotic", manufacturer: "Sun Pharma", price: 85, stock: 300 },
  { name: "Cetirizine", category: "Allergy", manufacturer: "GSK", price: 30, stock: 400 },
  { name: "Ibuprofen", category: "Pain Relief", manufacturer: "Cipla", price: 40, stock: 350 },
  { name: "Metformin", category: "Diabetes", manufacturer: "Sun Pharma", price: 55, stock: 250 },
  { name: "Amlodipine", category: "Blood Pressure", manufacturer: "Zydus", price: 65, stock: 280 },
  { name: "Azithromycin", category: "Antibiotic", manufacturer: "Cipla", price: 120, stock: 200 },
  { name: "Omeprazole", category: "Antacid", manufacturer: "Dr Reddy's", price: 45, stock: 320 },
  { name: "Cough Syrup", category: "Cold & Cough", manufacturer: "Himalaya", price: 90, stock: 180 },
  { name: "Vitamin C", category: "Supplement", manufacturer: "HealthKart", price: 150, stock: 500 },
  { name: "Insulin", category: "Diabetes", manufacturer: "Novo Nordisk", price: 350, stock: 100 },
  { name: "Aspirin", category: "Pain Relief", manufacturer: "Bayer", price: 25, stock: 400 },
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => `${randomFrom(["6", "7", "8", "9"])}${Math.floor(100000000 + Math.random() * 899999999)}`;

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for seeding...");

    const existingDoctors = await User.countDocuments({ role: "doctor" });
    if (existingDoctors > 0) {
      console.log(`⚠️  ${existingDoctors} doctors already exist in the database.`);
      console.log("Seeding again will DELETE all existing doctors, patients, rooms, and medicines.");
      console.log("If you're sure, comment out this safety check in seed.js and run again.");
      process.exit(0);
    }

    await User.deleteMany({ role: { $in: ["doctor", "patient"] } });
    await Room.deleteMany({});
    await Bed.deleteMany({});
    await Medicine.deleteMany({});
    console.log("Old data cleared.");

    // Seed 35 Doctors — one at a time (avoids hospitalId race condition)
    for (let i = 0; i < 35; i++) {
      const name = `Dr. ${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
      await User.create({
        name,
        email: `doctor${i + 1}@citycare.com`,
        password: "Doctor@123",
        role: "doctor",
        phone: randomPhone(),
        specialization: randomFrom(specializations),
        experience: Math.floor(Math.random() * 20) + 1,
        fees: (Math.floor(Math.random() * 15) + 3) * 100,
        availableDays: ["Mon", "Wed", "Fri"],
        availableTime: "10:00 AM - 4:00 PM",
      });
    }
    console.log("35 doctors created.");

    // Seed 50 Patients — one at a time
    for (let i = 0; i < 50; i++) {
      const name = `${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
      await User.create({
        name,
        email: `patient${i + 1}@citycare.com`,
        password: "Patient@123",
        role: "patient",
        phone: randomPhone(),
        age: Math.floor(Math.random() * 60) + 5,
        gender: randomFrom(["male", "female"]),
        address: `${Math.floor(Math.random() * 200) + 1}, MG Road, Delhi`,
      });
    }
    console.log("50 patients created.");

    // Seed Rooms + Beds
    const roomTypes = ["general", "private", "icu", "deluxe"];
    const bedLetters = "ABCDEFGHIJ";
    let totalBedsCreated = 0;

    for (let i = 1; i <= 20; i++) {
      const type = randomFrom(roomTypes);
      const totalBeds = type === "icu" ? 2 : type === "general" ? 6 : 2;
      const roomNumber = `${100 + i}`;

      const room = await Room.create({
        roomNumber,
        roomType: type,
        pricePerDay: type === "icu" ? 5000 : type === "deluxe" ? 3000 : type === "private" ? 2000 : 800,
        totalBeds,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} ward, Floor ${Math.ceil(i / 5)}`,
      });

      const beds = [];
      for (let b = 0; b < totalBeds; b++) {
        beds.push({ room: room._id, bedNumber: `${roomNumber}-${bedLetters[b]}` });
      }
      await Bed.create(beds);
      totalBedsCreated += totalBeds;
    }
    console.log(`20 rooms created with ${totalBedsCreated} total beds.`);

    // Seed Medicines
    await Medicine.create(medicinesData);
    console.log("12 medicines created.");

    console.log("\n✅ Seeding complete!");
    console.log("Sample doctor login: doctor1@citycare.com / Doctor@123");
    console.log("Sample patient login: patient1@citycare.com / Patient@123");

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedData();