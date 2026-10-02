const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe, updateMe, changePassword, uploadProfilePhoto } = require("../controllers/authController");
const upload = require("../middleware/uploadMiddleware");
const { registerValidation, loginValidation } = require("../middleware/validators");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerValidation, registerUser);
router.post("/login", loginValidation, loginUser);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.post("/upload-photo", protect, upload.single("photo"), uploadProfilePhoto);
router.put("/change-password", protect, changePassword);

module.exports = router;