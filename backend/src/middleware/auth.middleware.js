/**
 * @file auth.middleware.js
 * @description Authentication and authorization middleware: verifies Bearer JWTs
 * and restricts routes to allowed roles.
 * Code based on the following source:
 *
 * https://www.npmjs.com/package/jsonwebtoken
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
 * https://expressjs.com/en/guide/writing-middleware/
 */

const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Verify the Bearer token in the Authorization header and attach the identity
 * to req.user. Responds 401 for missing, expired, or invalid tokens.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check header exists and uses "Bearer <token>" schema
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token missing or malformed.",
      },
    });

  const token = authHeader.split(" ")[1];

  try {
    // Verify sig & check exp using JWT_SECRET
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach standard identity payload to request object
    req.user = { id: decoded.sub, role: decoded.role };

    next();
  } catch (err) {
    // Distinguish exp from other errors without leaking internals
    if (err.name == "TokenExpiredError")
      return res.status(401).json({
        error: {
          code: "TOKEN_EXPIRED",
          message: "Token has expired. Please log in again.",
        },
      });

    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token.",
      },
    });
  }
};

/**
 * Build role-based authorization middleware.
 * @param {...string} allowedRoles - The roles permitted to pass through.
 * @returns {Function} A middleware that responds 403 when the role is not allowed.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if(!req.user){
      return res.status(401).json({ message: "Unauthorized access" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};


module.exports = { authenticate, authorizeRoles };
