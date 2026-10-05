const express = require("express");
const router = express.Router();
const {
  searchPatient,
  getPendingMedicines,
  dispenseMedicines,
  verifyDispensePayment,
  getMyDispenseHistory,
  getPatientDispenseHistory,
  getAllDispenses,
} = require("../controllers/pharmacyController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/patients/search", protect, authorize("staff"), searchPatient);
router.get("/patients/:patientId/pending-medicines", protect, authorize("staff"), getPendingMedicines);
router.post("/dispense", protect, authorize("staff"), dispenseMedicines);
router.post("/dispense/:id/verify-payment", protect, authorize("staff"), verifyDispensePayment);
router.get("/my-history", protect, authorize("patient"), getMyDispenseHistory);
router.get("/patient/:patientId/history", protect, authorize("doctor", "admin"), getPatientDispenseHistory);
router.get("/all", protect, authorize("admin"), getAllDispenses);

module.exports = router;