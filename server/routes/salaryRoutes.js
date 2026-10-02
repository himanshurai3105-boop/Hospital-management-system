const express = require("express");
const router = express.Router();
const {
  setBaseSalary,
  generateMonthlySalary,
  getAllSalaries,
  markSalaryPaid,
  getMySalary,
} = require("../controllers/salaryController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.put("/doctors/:id/base-salary", protect, authorize("admin"), setBaseSalary);
router.post("/generate", protect, authorize("admin"), generateMonthlySalary);
router.get("/all", protect, authorize("admin"), getAllSalaries);
router.put("/:id/pay", protect, authorize("admin"), markSalaryPaid);
router.get("/my", protect, authorize("doctor", "receptionist", "staff"), getMySalary);

module.exports = router;