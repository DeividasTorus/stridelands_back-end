const pool = require("../config/db"); // ✅ Correct path to database connection

const getUserStats = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        console.log(`📡 Fetching stats for user ID: ${userId}`);

        const userStats = await pool.query("SELECT * FROM user_stats WHERE user_id = $1", [userId]);

        if (userStats.rows.length === 0) {
            return res.status(404).json({ error: "User stats not found" });
        }

        res.json(userStats.rows[0]);
    } catch (error) {
        console.error("❌ Error fetching user stats:", error.message);
        res.status(500).json({ error: "Server error while fetching user stats" });
    }
};

const updateUserStats = async (req, res) => {
    try {
        const userId = req.params.id;
        const { level, experience, max_experience, health, max_health, strength, defense, credits } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        console.log(`📡 Updating stats for user ID: ${userId}`);

        const result = await pool.query(
            `UPDATE user_stats 
             SET level = $1, experience = $2, max_experience = $3, health = $4, max_health = $5, strength = $6, defense = $7, credits = $8, updated_at = NOW()
             WHERE user_id = $9 RETURNING *`,
            [level, experience, max_experience, health, max_health, strength, defense, credits, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User stats not found" });
        }

        res.json({ message: "User stats updated successfully", userStats: result.rows[0] });

    } catch (error) {
        console.error("❌ Error updating user stats:", error.message);
        res.status(500).json({ error: "Server error while updating user stats" });
    }
};

module.exports = { getUserStats, updateUserStats };
