const pool = require("../config/db"); // ✅ Correct path to database connection

// Get user's step tracking data
const getUserSteps = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const result = await pool.query("SELECT * FROM userSteps WHERE user_id = $1", [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User steps not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error fetching user steps:", error.message);
        res.status(500).json({ error: "Server error while fetching steps" });
    }
};

// Start step tracking session
const startStepTracking = async (req, res) => {
    try {
        const userId = req.params.id;
        const { currentStepCount } = req.body;

        if (!userId || currentStepCount === undefined) {
            return res.status(400).json({ error: "User ID and currentStepCount are required" });
        }

        const result = await pool.query(
            `UPDATE userSteps
             SET is_tracking = true,
                 tracking_start_time = NOW(),
                 steps_at_session_start = $1,
                 updated_at = NOW()
             WHERE user_id = $2
             RETURNING *`,
            [currentStepCount, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User steps not found" });
        }

        res.json({ message: "Step tracking started", userSteps: result.rows[0] });

    } catch (error) {
        console.error("❌ Error starting step tracking:", error.message);
        res.status(500).json({ error: "Server error while starting step tracking" });
    }
};

// Stop step tracking session and calculate steps gained
const stopStepTracking = async (req, res) => {
    try {
        const userId = req.params.id;
        const { currentStepCount } = req.body;

        if (!userId || currentStepCount === undefined) {
            return res.status(400).json({ error: "User ID and currentStepCount are required" });
        }

        const existing = await pool.query("SELECT * FROM userSteps WHERE user_id = $1", [userId]);

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "User steps not found" });
        }

        const sessionStart = existing.rows[0].steps_at_session_start;
        const stepsGained = Math.max(currentStepCount - sessionStart, 0);

        const result = await pool.query(
            `UPDATE userSteps
             SET is_tracking = false,
                 stepsGained = stepsGained + $1,
                 totalSteps = totalSteps + $1,
                 updated_at = NOW()
             WHERE user_id = $2
             RETURNING *`,
            [stepsGained, userId]
        );

        res.json({ message: "Step tracking stopped", userSteps: result.rows[0] });

    } catch (error) {
        console.error("❌ Error stopping step tracking:", error.message);
        res.status(500).json({ error: "Server error while stopping step tracking" });
    }
};

// (Optional) Reset user's steps (if needed)
const resetUserSteps = async (req, res) => {
    try {
        const userId = req.params.id;

        const result = await pool.query(
            `UPDATE userSteps
             SET is_tracking = false,
                 stepsGained = 0,
                 totalSteps = 0,
                 steps_at_session_start = 0,
                 tracking_start_time = NULL,
                 updated_at = NOW()
             WHERE user_id = $1
             RETURNING *`,
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User steps not found" });
        }

        res.json({ message: "User steps reset", userSteps: result.rows[0] });
    } catch (error) {
        console.error("❌ Error resetting user steps:", error.message);
        res.status(500).json({ error: "Server error while resetting user steps" });
    }
};

module.exports = {
    getUserSteps,
    startStepTracking,
    stopStepTracking,
    resetUserSteps, // Optional
};
