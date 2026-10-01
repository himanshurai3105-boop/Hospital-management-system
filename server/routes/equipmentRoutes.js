const express = require("express");
const router = express.Router();
const {
  getAllEquipment,
  addEquipment,
  editEquipment,
  deleteEquipment,
  scheduleCheckup,
  completeCheckup,
  getDoctorCheckups,
  getMyCheckups,
  getAllCheckups,
} = require("../controllers/equipmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, getAllEquipment);
router.post("/", protect, authorize("admin"), addEquipment);
router.put("/:id", protect, authorize("admin"), editEquipment);
router.delete("/:id", protect, authorize("admin"), deleteEquipment);

router.post("/checkup", protect, authorize("doctor"), scheduleCheckup);
router.put("/checkup/:id/complete", protect, authorize("doctor"), completeCheckup);
router.get("/doctor/checkups", protect, authorize("doctor"), getDoctorCheckups);
router.get("/my-checkups", protect, authorize("patient"), getMyCheckups);
router.get("/checkups/all", protect, authorize("admin"), getAllCheckups);

module.exports = router;