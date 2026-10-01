const express = require("express");
const router = express.Router();
const {
  getAllMedicines,
  addMedicine,
  editMedicine,
  deleteMedicine,
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/medicineController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getAllMedicines); // public - browse medicines
router.post("/", protect, authorize("admin"), addMedicine);
router.put("/:id", protect, authorize("admin"), editMedicine);
router.delete("/:id", protect, authorize("admin"), deleteMedicine);

router.post("/order", protect, authorize("patient"), placeOrder);
router.get("/my-orders", protect, authorize("patient"), getMyOrders);
router.get("/orders/all", protect, authorize("admin"), getAllOrders);
router.put("/orders/:id/status", protect, authorize("admin"), updateOrderStatus);

module.exports = router;