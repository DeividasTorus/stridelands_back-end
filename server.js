const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser"); // ✅ Required for reading cookies
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const resourcesRoutes = require('./routes/resourcesRoutes')
const pool = require("./config/db");
const createTables = require("./config/dbInit"); // Import table initializer

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration (Allows Cookies to be Sent & Received)
app.use(cors({
  origin: "http://localhost:19006", // Replace with your frontend URL (Expo)
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

// ✅ API Health Check
app.get("/", (req, res) => {
  res.send("Travian-style Game API is running!");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
