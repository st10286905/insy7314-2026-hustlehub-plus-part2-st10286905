const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const { errorHandler, errorHandler404 } = require("./middleware/error.handler");

const app = express();

// Security setup for helmet & cors
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", CLIENT_ORIGIN],
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
    origin: CLIENT_ORIGIN,
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
