const jwt = require("jsonwebtoken");
const config = require("../config");

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

module.exports = authenticate;
