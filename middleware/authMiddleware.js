const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Authentication error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Unauthorized: Token expired" });
    }
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

// ✅ Corrected export for CommonJS
module.exports = authMiddleware;

