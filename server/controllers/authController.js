const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

const isStr = (v) => typeof v === "string";
const clean = (v, max = 200) => (isStr(v) ? v.trim().slice(0, max) : undefined);
const MAX_PASSWORD = 72; // bcrypt sirf itne bytes dekhta hai
const strongPassword = (p) =>
  isStr(p) &&
  p.length >= 8 && p.length <= MAX_PASSWORD &&
  /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);

// Login / register / me sab ka user ek jaisa (password aur aadhaar hamesha bahar)
const userPayload = (user) => {
  const { password, __v, ...safe } = user.toObject();
  return safe;
};

const handleError = (res, error, fallback) => {
  if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
  if (error.code === 11000) return res.status(400).json({ message: "User already exists" });
  console.error(error);
  return res.status(500).json({ message: fallback });
};

// Public signup se sirf ye fields. role, staffType, baseSalary, isActive, hospitalId, fees wagairah kabhi nahi
const REGISTER_FIELDS = ["phone", "age", "gender", "address"];

// @route POST /api/auth/register  (sirf patient banta hai)
exports.registerUser = async (req, res) => {
  try {
    const name = clean(req.body.name, 100);
    const email = isStr(req.body.email) ? req.body.email.trim().toLowerCase() : "";
    const password = req.body.password;

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!email) return res.status(400).json({ message: "Email is required" });
   if (!strongPassword(password)) {
  return res.status(400).json({
    message: "Password must be 8 to 72 characters with an uppercase letter, a lowercase letter, a number and a special character",
  });
}

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const extra = {};
    for (const f of REGISTER_FIELDS) {
      const v = req.body[f];
      if (v === undefined || v === "") continue;
      if (typeof v === "string") extra[f] = v.trim().slice(0, 300);
      else if (typeof v === "number") extra[f] = v;
    }

    const user = await User.create({ name, email, password, ...extra, role: "patient" });

    res.status(201).json({ ...userPayload(user), token: generateToken(user._id) });
  } catch (error) {
    handleError(res, error, "Registration failed");
  }
};

// @route POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const email = isStr(req.body.email) ? req.body.email.trim().toLowerCase() : "";
    const password = req.body.password;
    if (!email || !isStr(password)) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact the hospital administration.",
      });
    }

    // /auth/me jaisa hi poora user (staffType aur labSpecialization ke saath)
    res.json({ ...userPayload(user), token: generateToken(user._id) });
  } catch (error) {
    handleError(res, error, "Login failed");
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// @route PUT /api/auth/me
// @desc  Any logged-in user updates their own profile
exports.updateMe = async (req, res) => {
  try {
    const b = req.body;
    const updates = {};

    if (b.name !== undefined) {
      const n = clean(b.name, 100);
      if (!n) return res.status(400).json({ message: "Name cannot be empty" });
      updates.name = n;
    }
    if (b.phone !== undefined) updates.phone = clean(b.phone, 20) || "";
    if (b.address !== undefined) updates.address = clean(b.address, 300) || "";
    if (b.gender !== undefined && b.gender !== "") updates.gender = clean(b.gender, 20);
    if (b.age !== undefined && b.age !== "") {
      const age = Number(b.age);
      if (!Number.isFinite(age)) return res.status(400).json({ message: "Age must be a number" });
      updates.age = age;
    }

    // Doctor: fees aur specialization sirf admin badal sakta hai (editDoctor se)
    if (req.user.role === "doctor") {
      if (b.experience !== undefined && b.experience !== "") {
        const exp = Number(b.experience);
        if (!Number.isFinite(exp) || exp < 0 || exp > 80) {
          return res.status(400).json({ message: "Enter valid experience in years" });
        }
        updates.experience = exp;
      }
      if (b.availableDays !== undefined) {
        if (!Array.isArray(b.availableDays) || b.availableDays.length > 7) {
          return res.status(400).json({ message: "Invalid available days" });
        }
        updates.availableDays = b.availableDays.filter(isStr).map((d) => d.trim().slice(0, 15));
      }
      if (b.availableTime !== undefined) updates.availableTime = clean(b.availableTime, 50) || "";
    }

    if (Object.keys(updates).length === 0) return res.json(req.user);

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json(user);
  } catch (error) {
    handleError(res, error, "Could not update profile");
  }
};

// @route PUT /api/auth/change-password
// @desc  Logged-in user changes their own password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!isStr(currentPassword) || !isStr(newPassword)) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 8 || newPassword.length > MAX_PASSWORD) {
      return res.status(400).json({ message: `New password must be 8 to ${MAX_PASSWORD} characters` });
    }

    const user = await User.findById(req.user._id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from the current one" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    handleError(res, error, "Could not change password");
  }
};

// @route POST /api/auth/upload-photo
// @desc  Any logged-in user uploads/updates their profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: req.file.path },
      { new: true }
    ).select("-password");

    res.json({ message: "Profile photo updated", profilePhoto: user.profilePhoto, user });
  } catch (error) {
    handleError(res, error, "Could not upload photo");
  }
};