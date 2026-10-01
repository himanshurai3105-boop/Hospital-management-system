const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Please enter a valid email address").normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/).withMessage("Password must contain at least one special character"),
  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/).withMessage("Phone number must be a valid 10-digit Indian mobile number"),
  body("aadhaarNumber")
    .optional({ checkFalsy: true })
    .matches(/^\d{12}$/).withMessage("Aadhaar number must be exactly 12 digits"),
  handleValidationErrors,
];

const loginValidation = [
  body("email").isEmail().withMessage("Please enter a valid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

module.exports = { registerValidation, loginValidation, handleValidationErrors };