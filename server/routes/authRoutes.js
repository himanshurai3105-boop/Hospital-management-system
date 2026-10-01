const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe, updateMe, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { registerValidation, loginValidation } = require("../middleware/validators");

router.post("/register", registerValidation, registerUser);
router.post("/login", loginValidation, loginUser);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);

module.exports = router;