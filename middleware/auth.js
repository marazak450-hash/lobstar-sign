const jwt = require("jsonwebtoken");

/**
 * Verify JWT from Authorization header (Bearer <token>).
 * Attaches decoded payload to req.user.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorised, no token." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Not authorised, invalid token." });
  }
};

/**
 * Restrict access to specified roles.
 * Must be used after `protect`.
 */
const restrictTo = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission for this action." });
    }
    next();
  };

module.exports = { protect, restrictTo };
