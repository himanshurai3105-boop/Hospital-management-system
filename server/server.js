process.env.TZ = "Asia/Kolkata"; // sabse upar, kisi require se pehle

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const { startAutoCancelJob } = require("./jobs/autoCancelAppointments");
const { startQueueRollover } = require("./jobs/queueRollover");

dotenv.config();
connectDB();

const app = express();

// Render/Vercel jaise hosts proxy ke peeche hote hain: sahi client IP ke liye
app.set("trust proxy", 1);

// Health check (uptime monitor ke liye), rate limit aur CORS se pehle
app.get("/health", (req, res) => res.json({ ok: true }));

app.use(helmet());

// CLIENT_URL mein ek ya kai domain (comma se), end mein "/" nahi
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman / server-to-server
      return cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

// NoSQL injection: Express 5 mein req.query read-only hai, to body aur params hi sanitize
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// General limit. Hospital ke saare staff ek hi IP se aate hain aur kai pages har 15-30 sec par refresh hote hain, isliye bada rakha hai
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});
app.use("/api", generalLimiter);

// Login / register: sirf galat koshishein ginti hain (sahi login limit nahi khata)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again after 15 minutes" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/", (req, res) => res.send("Hospital Management API running..."));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/medicines", require("./routes/medicineRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/equipment", require("./routes/equipmentRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/salary", require("./routes/salaryRoutes"));
app.use("/api/shift-settings", require("./routes/shiftSettingsRoutes"));
app.use("/api/receptionist", require("./routes/receptionistRoutes"));
app.use("/api/room-requests", require("./routes/roomRequestRoutes"));
app.use("/api/pharmacy", require("./routes/pharmacyRoutes"));
app.use("/api/doctor-insights", require("./routes/doctorInsightsRoutes"));
app.use("/api/lab", require("./routes/labRoutes"));

// Global error handler (stack trace client ko kabhi nahi jaata)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong. Please try again later." });
});

process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAutoCancelJob();
  startQueueRollover();
});