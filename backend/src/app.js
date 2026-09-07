/**
 * @file app.js
 * @description Express application setup: security middleware (Helmet, CORS), JSON parsing,
 * auth routes, and centralized error handling.
 * Code based on the following source:
 *
 * https://www.npmjs.com/package/express
 * https://expressjs.com/en/4x/api/express/
 * https://helmetjs.github.io/
 * https://helmetjs.github.io/#content-security-policy
 * https://www.npmjs.com/package/cors
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const config = require("./config");
const authRoutes = require("./routes/auth.routes");
const { errorHandler, errorHandler404 } = require("./middleware/error.middleware");

const app = express();

// Security setup for helmet & cors
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", config.clientOrigin],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
app.use(
  cors({
    origin: config.clientOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Standard middleware with limit configured to prevent DoS 
app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use(errorHandler);
app.use(errorHandler404);

module.exports = app;
