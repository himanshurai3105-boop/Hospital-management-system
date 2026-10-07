const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    // Delete ya deactivate hua user purane token se andar nahi aa sakta
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "Account not found or deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Role-based access
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Role '${req.user?.role}' is not allowed` });
    }
    next();
  };
};

// Staff ke andar type ka check (pharmacist, lab_technician, ...)
exports.requireStaffType = (...types) => {
  return (req, res, next) => {
    if (req.user?.role === "staff" && types.includes(req.user.staffType)) return next();
    return res.status(403).json({ message: "This section is not available for your staff type" });
  };
};