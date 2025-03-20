const express = require("express");
const { register, login, logout, getProfile } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware"); // Authentication middleware

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", authMiddleware, logout);

router.get("/me", authMiddleware, getProfile);

module.exports = router;
