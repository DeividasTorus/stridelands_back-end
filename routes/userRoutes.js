const express = require("express");
const { getUserStats, updateUserStats } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats/:id", authMiddleware, getUserStats); // ✅ Get user stats
router.put("/stats/:id", authMiddleware, updateUserStats); // ✅ Update user stats

module.exports = router;
