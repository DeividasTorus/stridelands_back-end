const express = require("express");
const pool = require("../db"); // Make sure this points to your database connection

const router = express.Router();

// 📌 GET user stats by user ID
router.get("/user/stats/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("SELECT * FROM user_stats WHERE user_id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User stats not found" });
        }

        res.json(result.rows[0]); // Send back the user's stats
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
