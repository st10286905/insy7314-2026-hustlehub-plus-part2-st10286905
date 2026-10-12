const { rateLimit } = require("express-rate-limit");

const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many booking requests. Please try again later.",
    },
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many auth requests. Please try again later.",
    },
  },
});

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    },
  },
});

module.exports = {
  authRateLimiter,
  bookingRateLimiter,
  globalRateLimiter
};
