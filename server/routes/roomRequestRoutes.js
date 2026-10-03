const express = require("express");
const router = express.Router();
const {
  createRoomRequest,
  getMyRoomRequests,
  getPendingRequests,
  allotBed,
  rejectRequest,
  getOccupancyOverview,
} = require("../controllers/roomRequestController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("doctor"), createRoomRequest);
router.get("/my", protect, authorize("doctor"), getMyRoomRequests);
router.get("/pending", protect, authorize("staff"), getPendingRequests);
router.put("/:id/allot", protect, authorize("staff"), allotBed);
router.put("/:id/reject", protect, authorize("staff"), rejectRequest);
router.get("/occupancy", protect, authorize("staff", "admin", "doctor"), getOccupancyOverview);

module.exports = router;