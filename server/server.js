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

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Body parser
app.use(express.json({ limit: "10kb" })); // request body size limit

// Prevent NoSQL injection — custom version (Express 5's req.query is read-only,
// so we only sanitize body and params, not query)
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// Rate limiting — general API (prevents brute force / abuse)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // max 200 requests per IP per window
  message: { message: "Too many requests, please try again later" },
});
app.use("/api", generalLimiter);

// Stricter rate limit specifically for login/register (prevents brute force password guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // max 10 login/register attempts per 15 min per IP
  message: { message: "Too many login attempts, please try again after 15 minutes" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/medicines", require("./routes/medicineRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

app.get("/", (req, res) => res.send("Hospital Management API running..."));
app.use("/api/equipment", require("./routes/equipmentRoutes"));

app.use("/api/feedback", require("./routes/feedbackRoutes"));

app.use("/api/salary", require("./routes/salaryRoutes"));

app.use("/api/shift-settings", require("./routes/shiftSettingsRoutes"));
app.use("/api/receptionist", require("./routes/receptionistRoutes"));
app.use("/api/room-requests", require("./routes/roomRequestRoutes"));
app.use("/api/pharmacy", require("./routes/pharmacyRoutes"));
app.use("/api/doctor-insights", require("./routes/doctorInsightsRoutes"));
app.use("/api/lab", require("./routes/labRoutes"));

// Global error handler (catches anything unexpected, never leaks stack trace to client)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong. Please try again later." });
});



// ... baaki saare app.use() routes ...

app.get("/", (req, res) => res.send("Hospital Management API running..."));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong. Please try again later." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAutoCancelJob();
  startQueueRollover();
});