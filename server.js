/**
 * Freewill E-Commerce – Secure Express Server
 */

require("dotenv").config();

const express = require("express");
const path = require("path");
const morgan = require("morgan");
const compression = require("compression");

const { applySecurityMiddleware } = require("./middleware/security");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");

const app = express();

// ── Security first ────────────────────────────────────────────────────────────
applySecurityMiddleware(app);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));          // guard against large payload attacks
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── HTTP request logging (development only) ───────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Static frontend ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
  etag: true,
}));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Never leak stack traces in production
  const isDev = process.env.NODE_ENV === "development";
  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: err.message || "Internal server error.",
    ...(isDev && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Freewill server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

module.exports = app;
