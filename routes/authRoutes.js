const jwt = require("jsonwebtoken");
const express = require("express");
const pool = require("../config/db"); // Database connection
const bcrypt = require("bcryptjs"); // For password hashing

const router = express.Router();

// ✅ User Registration (Fixed)
router.post("/register", async (req, res) => {
    const { username, email, password, tribe } = req.body;

    // ✅ Validate request data
    if (!username || !email || !password || !tribe) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        console.log("📩 Registration request received:", req.body);

        // ✅ Check if user already exists
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        // ✅ Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ✅ Start a database transaction to ensure consistency
        await pool.query("BEGIN");

        // ✅ Insert user into users table
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password, tribe) VALUES ($1, $2, $3, $4) RETURNING id, username, email, tribe, created_at",
            [username, email, hashedPassword, tribe]
        );

        const userId = newUser.rows[0].id;
        console.log("✅ User registered successfully:", newUser.rows[0]);

        // ✅ Insert default user stats into user_stats table
        await pool.query(
            `INSERT INTO user_stats (user_id, level, experience, max_experience, health, max_health, strength, defense) 
             VALUES ($1, 1, 0, 100, 100, 100, 10, 10)`,
            [userId]
        );

        console.log("✅ Default user stats created for user:", userId);

        // ✅ Commit transaction
        await pool.query("COMMIT");

        // ✅ Generate JWT token
        const token = jwt.sign(
            { id: userId, email, username },
            process.env.JWT_SECRET || "your_jwt_secret", // Use environment variable
            { expiresIn: "7d" } // Token expiration
        );

        res.status(201).json({
            message: "User registered successfully",
            user: newUser.rows[0],
            token,
        });
    } catch (error) {
        // If any error occurs, rollback transaction to avoid partial data insertion
        await pool.query("ROLLBACK");
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// ✅ User Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // ✅ Validate input
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        console.log("🔑 Login attempt:", email);

        // ✅ Check if user exists
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const userData = user.rows[0];

        // ✅ Compare password
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // ✅ Generate JWT token
        const token = jwt.sign(
            { id: userData.id, email: userData.email, username: userData.username },
            process.env.JWT_SECRET || "your_jwt_secret", // Replace with environment variable
            { expiresIn: "7d" } // Token expiration
        );

        console.log("✅ Login successful:", userData.username);

        res.status(200).json({
            message: "Login successful",
            user: {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                tribe: userData.tribe,
                created_at: userData.created_at,
            },
            token,
        });
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;
