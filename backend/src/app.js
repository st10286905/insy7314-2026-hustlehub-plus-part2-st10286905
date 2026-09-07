const express = require("express");
const authRoutes = require("./routes/auth.routes");
const { errorHandler, errorHandler404 } = require("./middleware/error.handler");

const app = express();

// Standard middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use(errorHandler);
app.use(errorHandler404);

module.exports = app;
