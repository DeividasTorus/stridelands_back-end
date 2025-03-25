const express = require("express");
const {
    getUserSteps,
    startStepTracking,
    stopStepTracking,
    resetUserSteps
} = require("../controllers/stepsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/steps/:id", authMiddleware, getUserSteps); // 📥 Get user step data
router.post("/steps/:id/start", authMiddleware, startStepTracking); // ▶️ Start step tracking
router.post("/steps/:id/stop", authMiddleware, stopStepTracking); // ⏹ Stop step tracking
router.post("/steps/:id/reset", authMiddleware, resetUserSteps); // 🔁 Reset step data (optional)

module.exports = router;
