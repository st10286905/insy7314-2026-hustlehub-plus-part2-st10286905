const express = require('express');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Standard middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Centralised 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Cannot ${req.method} ${req.originalUrl}` }
  });
});

// Centralised error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred on the server.' }
  });
});

module.exports = app;