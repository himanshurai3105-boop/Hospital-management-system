const express = require("express");
const router = express.Router();
const { getShiftSettings, updateShiftSettings } = require("../controllers/shiftSettingsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, getShiftSettings);
router.put("/", protect, authorize("admin"), updateShiftSettings);

module.exports = router;