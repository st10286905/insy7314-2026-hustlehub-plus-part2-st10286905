/**
 * @file error.middleware.js
 * @description Centralized error handling middleware: a 500 handler for
 * unexpected errors and a 404 handler for unknown routes.
 * Code based on the following source:
 *
 * https://expressjs.com/en/guide/error-handling/
 * https://expressjs.com/en/guide/writing-middleware/
 */

// Centralised error handling middleware
/**
 * Handle unexpected errors and respond with a generic 500 payload.
 * @param {Error} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred on the server.",
    },
  });
};

// Centralised 404 handler
// Modified to return less information about the requested resource to avoid exposing sensitive information.
/**
 * Handle unknown routes and respond with a generic 404 payload.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void}
 */
const errorHandler404 = (req, res) => {
  return res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `The requested resource was not found.`,
    },
  });
};

module.exports = { errorHandler, errorHandler404 };
