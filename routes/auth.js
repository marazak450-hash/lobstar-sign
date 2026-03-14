const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const { authLimiter } = require("../middleware/security");
const validate = require("../middleware/validate");

// In a real app these come from Mongoose models.
// Kept simple here to avoid a database dependency in the demo.
const users = new Map(); // { email -> { id, name, email, passwordHash, role } }

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "change_me",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ── Register ──────────────────────────────────────────────────────────────────
router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters.")
      .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter.")
      .matches(/[0-9]/).withMessage("Password must contain a number.")
      .matches(/[^A-Za-z0-9]/).withMessage("Password must contain a special character."),
  ],
  validate,
  async (req, res) => {
    const { name, email, password } = req.body;

    if (users.has(email)) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      id: Date.now().toString(),
      name,
      email,
      passwordHash,
      role: "customer",
    };
    users.set(email, user);

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, name, email, role: user.role } });
  }
);

// ── Login ─────────────────────────────────────────────────────────────────────
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    const user = users.get(email);

    // Use constant-time comparison to prevent timing attacks
    const dummyHash = "$2a$12$invalidhashtopreventtimingattack000000000000000000000000";
    const isMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
  }
);

module.exports = router;
