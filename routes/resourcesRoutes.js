const express = require("express");
const { getUserResources, updateUserResources } = require("../controllers/resourcesController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/resources/:id", authMiddleware, getUserResources); // ✅ Get user stats
router.put("/resources/:id", authMiddleware, updateUserResources); // ✅ Update user stats

module.exports = router;
