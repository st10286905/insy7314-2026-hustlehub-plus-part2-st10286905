// Centralised error handling middleware
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
const errorHandler404 = (req, res) => {
  return res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `The requested resource was not found.`,
    },
  });
};

module.exports = { errorHandler, errorHandler404 };
