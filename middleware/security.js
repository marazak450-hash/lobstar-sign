/**
 * security.js
 * Central security middleware stack for Freewill.
 * Applied globally in server.js before any route handler.
 */

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin, curl during dev)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  credentials: true,
  maxAge: 86400, // Preflight cache: 24 h
};

// ── Rate limiters ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

// ── Helmet (HTTP security headers) ───────────────────────────────────────────
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // tighten once CSS-in-JS is removed
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,       // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false, // enable when serving cross-origin resources
});

// ── Apply all middleware ──────────────────────────────────────────────────────
const applySecurityMiddleware = (app) => {
  app.use(helmetConfig);
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // handle pre-flight
  app.use(globalLimiter);

  // Strip MongoDB operators ($, .) from req.body / req.query / req.params
  app.use(mongoSanitize());

  // Sanitise user input against XSS
  app.use(xssClean());

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Trust the first proxy only (needed when behind Nginx/load balancer)
  app.set("trust proxy", 1);
};

module.exports = { applySecurityMiddleware, authLimiter };
