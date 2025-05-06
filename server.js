const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser"); // ✅ Required for reading cookies
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const resourcesRoutes = require('./routes/resourcesRoutes')
const buildingsRoutes = require('./routes/buildingsRoutes');
const warriorsRoutes = require('./routes/warriorsRoutes');
const stepsRoutes = require("./routes/stepsRoutes");
const pool = require("./config/db");
const createTables = require("./config/dbInit"); // Import table initializer

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration (Allows Cookies to be Sent & Received)
app.use(cors({
  origin: "http://localhost:3000", // Replace with your frontend URL (Expo)
  credentials: true, // ✅ Allows sending HTTP-only cookies
}));

// ✅ Middleware for JSON & Cookies
app.use(express.json());
app.use(cookieParser()); // ✅ Parse cookies in incoming requests

// Run database table check & creation on startup
createTables();

// Test database connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Database connection error:", err));

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/user", resourcesRoutes);
app.use("/user/buildings", buildingsRoutes);
app.use("/user", stepsRoutes);
app.use("/user/warriors", warriorsRoutes);

// ✅ API Health Check
app.get("/", (req, res) => {
  res.send("Travian-style Game API is running!");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// function startTrainingProcessor() {
//   setInterval(async () => {
//     console.log("🔄 Checking training queue...");

//     try {
//       const { rows } = await pool.query(`
//         SELECT * FROM warriorUpgradeQueue
//         WHERE finish_time <= NOW()
//       `);

//       console.log(`🔎 Found ${rows.length} rows to process`);

//       for (const row of rows) {
//         console.log(`🏹 Training finished: userId=${row.user_id}, warriorTypeId=${row.warrior_type_id}, count=${row.count}`);

//         await pool.query(`
//           UPDATE userWarriors
//           SET count = count + $1
//           WHERE user_id = $2 AND warrior_type_id = $3
//         `, [row.count, row.user_id, row.warrior_type_id]);

//         await pool.query(`
//           DELETE FROM warriorUpgradeQueue
//           WHERE id = $1
//         `, [row.id]);

//         console.log(`✅ Updated and deleted training for user ${row.user_id}`);
//       }

//     } catch (error) {
//       console.error('❌ Training queue error:', error);
//     }
//   }, 1000); // check every second
// }

// startTrainingProcessor();



