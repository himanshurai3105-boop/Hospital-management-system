const express = require("express");
const router = express.Router();
const {
  getAllRooms,
  addRoom,
  editRoom,
  deleteRoom,
  bookRoom,
  dischargeBed,
  getMyRoomBookings,
  getAllRoomBookings,
  getDoctorRoomBookings,
} = require("../controllers/roomController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getAllRooms);
router.post("/", protect, authorize("admin"), addRoom);
router.put("/:id", protect, authorize("admin"), editRoom);
router.delete("/:id", protect, authorize("admin"), deleteRoom);

router.post("/book", protect, authorize("doctor"), bookRoom);
router.put("/beds/:bedId/discharge", protect, authorize("admin"), dischargeBed);
router.get("/my-bookings", protect, authorize("patient"), getMyRoomBookings);
router.get("/bookings/all", protect, authorize("admin"), getAllRoomBookings);
router.get("/my-bookings-doctor", protect, authorize("doctor"), getDoctorRoomBookings);

module.exports = router;