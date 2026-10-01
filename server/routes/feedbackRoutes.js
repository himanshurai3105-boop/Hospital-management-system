const express = require("express");
const router = express.Router();
const {
  submitFeedback,
  getDoctorFeedback,
  getMyFeedback,
  getPendingFeedback,
  getRecentFeedback,
} = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("patient"), submitFeedback);
router.get("/pending", protect, authorize("patient"), getPendingFeedback);
router.get("/my", protect, authorize("patient"), getMyFeedback);
router.get("/recent", getRecentFeedback);
router.get("/doctor/:doctorId", getDoctorFeedback);

module.exports = router;