import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js'; // Ensure you have a PostgreSQL pool connection
import { findUserByUsername } from '../models/userModel.js';

dotenv.config();

// Function to generate JWT token
const generateToken = (id, username) => {
  return jwt.sign({ id, username }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Set token expiration (7 days)
  });
};

export const register = async (req, res) => {
  try {
    const { username, email, password, tribe } = req.body;

    // ✅ Validate input fields
    if (!username || !email || !password || !tribe) {
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log("📩 Registration request received:", { username, email, tribe });

    // ✅ Check if user already exists
    const userExists = await pool.query(
        "SELECT id FROM users WHERE username = $1 OR email = $2",
        [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert the new user into the database
    const userResult = await pool.query(
        `INSERT INTO users (username, email, password, tribe)
         VALUES ($1, $2, $3, $4) RETURNING id, username, email, tribe`,
        [username, email, hashedPassword, tribe]
    );

    const userId = userResult.rows[0].id;
    console.log("✅ User registered successfully:", userResult.rows[0]);

    // ✅ Insert default stats into user_stats
    const statsResult = await pool.query(
        `INSERT INTO user_stats (user_id, level, experience, max_experience, health, max_health, strength, defense) 
       VALUES ($1, 1, 0, 100, 100, 100, 10, 10) RETURNING *`,
        [userId]
    );
    console.log("✅ Default stats assigned:", statsResult.rows[0]);

    // ✅ Generate token
    const token = generateToken(userId, username);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        username: userResult.rows[0].username,
        email: userResult.rows[0].email,
        tribe: userResult.rows[0].tribe,
        stats: statsResult.rows[0] // Include stats in response
      },
      token
    });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    res.status(500).json({ error: "Registration failed" });
  }
};
