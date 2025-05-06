const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const pool = require("../config/db"); // PostgreSQL connection
const cookie = require("cookie");

dotenv.config();

// Function to generate JWT token
const generateToken = (id, username) => {
  return jwt.sign({ id, username }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ✅ REGISTER FUNCTION
const register = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { username, email, password, tribe, avatar } = req.body;
    if (!username || !email || !password || !tribe || !avatar) {
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log("📩 Registration request received:", { username, email, tribe });

    // ✅ Check if user already exists
    const userExists = await client.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new user
    const userResult = await client.query(
      `INSERT INTO users (username, email, password, tribe, avatar)
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, tribe, avatar`,
      [username, email, hashedPassword, tribe, avatar] // Ensure correct parameter order
    );


    const userId = userResult.rows[0].id;
    console.log("✅ User registered successfully:", userResult.rows[0]);

    // ✅ Insert default stats into user_stats
    await client.query(
      `INSERT INTO user_stats (user_id, level, experience, max_experience, health, max_health, strength, defense, credits) 
       VALUES ($1, 1, 0, 100, 100, 100, 10, 10, 0)`,
      [userId]
    );

    await client.query(
      `INSERT INTO resources (user_id, wood, clay, iron, crops) 
       VALUES ($1, 4000, 4000, 4000, 1000)`,
      [userId]
    );

    await client.query(
      `INSERT INTO userSteps (user_id, is_tracking, stepsGained, totalSteps, steps_at_session_start)
       VALUES ($1, false, 0, 0, 0)`,
      [userId]
    );

    // Fetch all warrior templates from warriorTypes
    const warriorTypes = await client.query(`SELECT * FROM warriorTypes`);

    // Insert one userWarrior for each warrior type
    const warriorInserts = warriorTypes.rows.map((warrior) => {
      return client.query(
        `INSERT INTO userWarriors (
      user_id,
      warrior_type_id,
      name,
      count,
      level,
      trainingCost,
      resourceCost,
      trainingTime,
      upgradingTime,
      attack,
      defense,
      speed
    ) VALUES (
      $1, $2, $3, 0, 1, $4, $5, $6, $7, $8, $9, $10
    )`,
        [
          userId,
          warrior.id,
          warrior.name,
          warrior.trainingcost,
          warrior.resourcecost,
          warrior.trainingtime,
          warrior.upgradingtime,
          warrior.attack,
          warrior.defense,
          warrior.speed
        ]
      );
    });

    await Promise.all(warriorInserts);



    // 1. Fetch all building type IDs
    const buildingTypes = await client.query(`SELECT id FROM BuildingTypes`);

    // 2. Insert a row into userBuildings for each type
    const buildingInserts = buildingTypes.rows.map(({ id }) => {
      return client.query(
        `INSERT INTO userBuildings (user_id, buildingTypeId, level, built) 
     VALUES ($1, $2, 0, false)`,
        [userId, id]
      );
    });

    // 3. Execute all inserts
    await Promise.all(buildingInserts);



    await client.query("COMMIT");

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        username: userResult.rows[0].username,
        email: userResult.rows[0].email,
        tribe: userResult.rows[0].tribe,
        avatar: userResult.rows[0].avatar,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Registration error:", error.message);
    res.status(500).json({ error: "Registration failed" });
  } finally {
    client.release();
  }
};

// ✅ LOGIN FUNCTION
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("🔑 Login attempt:", email);

    // ✅ Check if user exists
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userResult.rows[0];

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("✅ User authenticated:", { id: user.id, username: user.username });

    // ✅ Generate JWT token
    const token = generateToken(user.id, user.username);

    // ✅ Store token in HTTP-only cookie
    res.setHeader("Set-Cookie", cookie.serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    }));

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tribe: user.tribe,
        avatar: user.avatar
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
};

// ✅ LOGOUT FUNCTION
const logout = (req, res) => {
  res.setHeader("Set-Cookie", cookie.serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  }));

  res.json({ message: "Logout successful" });
};

// ✅ GET USER PROFILE FUNCTION
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query("SELECT id, username, email, tribe, avatar FROM users WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user: userResult.rows[0] });
  } catch (error) {
    console.error("❌ Error fetching user profile:", error.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// ✅ EXPORT MODULE (CommonJS)
module.exports = {
  register,
  login,
  logout,
  getProfile,
};
