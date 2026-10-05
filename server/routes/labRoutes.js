const express = require("express");
const router = express.Router();
const c = require("../controllers/labCatalogController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/tests", protect, authorize("doctor", "admin", "staff"), c.listTests);
router.post("/tests/seed-defaults", protect, authorize("admin"), c.seedDefaults);
router.post("/tests", protect, authorize("admin"), c.createTest);
router.put("/tests/:id/toggle", protect, authorize("admin"), c.toggleTest);
router.put("/tests/:id", protect, authorize("admin"), c.updateTest);

module.exports = router;