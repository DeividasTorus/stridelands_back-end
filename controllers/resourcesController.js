const pool = require("../config/db"); // ✅ Correct path to database connection

const getUserResources = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        console.log(`📡 Fetching resources for user ID: ${userId}`);

        const userResources = await pool.query("SELECT * FROM resources WHERE user_id = $1", [userId]);

        if (userResources.rows.length === 0) {
            return res.status(404).json({ error: "User stats not found" });
        }

        res.json(userResources.rows[0]);
    } catch (error) {
        console.error("❌ Error fetching user stats:", error.message);
        res.status(500).json({ error: "Server error while fetching user stats" });
    }
};

const updateUserResources = async (req, res) => {
    try {
        const userId = req.params.id;
        const { wood, clay, iron, crops} = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        console.log(`📡 Updating resources for user ID: ${userId}`);

        const result = await pool.query(
            `UPDATE resources
             SET wood = $1, clay = $2, iron = $3, crops = $4, updated_at = NOW()
             WHERE user_id = $5 RETURNING *`,
            [wood, clay, iron, crops, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User stats not found" });
        }

        res.json({ message: "User stats updated successfully", userResources: result.rows[0] });

    } catch (error) {
        console.error("❌ Error updating user stats:", error.message);
        res.status(500).json({ error: "Server error while updating user stats" });
    }
};

module.exports = { getUserResources, updateUserResources };