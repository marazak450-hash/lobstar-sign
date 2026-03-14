const { validationResult } = require("express-validator");

/**
 * Collect express-validator errors and return 400 if any exist.
 * Place after validation chains in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = validate;
