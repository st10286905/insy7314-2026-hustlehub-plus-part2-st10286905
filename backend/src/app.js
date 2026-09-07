const express = require('express');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Standard middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Centralised 404 handler
// Modified to return less information about the requested resource to avoid exposing sensitive information.
app.use((req, res) => {
  return res.status(404).json({
    error: { 
      code: 'NOT_FOUND', 
      message: `The requested resource was not found.` 
    }
  });
});

// Centralised error handling middleware
app.use((err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    error: { 
      code: 'INTERNAL_SERVER_ERROR', 
      message: 'An unexpected error occurred on the server.' 
    }
  });
});

module.exports = app;