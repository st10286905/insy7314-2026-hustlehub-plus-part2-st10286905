/**
 * @file app.js
 * @description Express application setup: security middleware (Helmet, CORS), JSON parsing,
 * Swagger docs, auth routes, and centralized error handling.
 * Code based on the following source:
 *
 * https://www.npmjs.com/package/express
 * https://expressjs.com/en/4x/api/express/
 * https://helmetjs.github.io/
 * https://helmetjs.github.io/#content-security-policy
 * https://www.npmjs.com/package/cors
 * https://www.npmjs.com/package/swagger-jsdoc
 * https://www.npmjs.com/package/swagger-ui-express
 */
 
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const config = require("./config");
const authRoutes = require("./routes/auth.routes");
const gigRoutes = require("./routes/gig.routes");
const connectToDB = require("./config/db");
const { errorHandler, errorHandler404 } = require("./middleware/error.middleware");
 
const app = express();
 
app.disable("x-powered-by");
 
// Swagger docs
// Mounted BEFORE the strict global helmet config so /api-docs gets its own
// relaxed CSP and the request is finished before the strict policy applies.
// Only exposed outside production.
if (process.env.NODE_ENV !== "production") {
  const protocol = config.ssl.useHttps ? "https" : "http";
 
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "HustleHub+ API",
        version: "0.1.0",
        description: "HustleHub+ REST API documentation",
      },
      servers: [{ url: `${protocol}://localhost:${config.port}` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
    // Absolute path so it works regardless of where Node is started from
    apis: [path.join(__dirname, "routes", "*.js")],
  });
 
  
  app.use(
    "/api-docs",
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        // Prevents assets being forced to https on plain-http localhost
        "upgrade-insecure-requests": null,
      },
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {explorer: true}),
  );
}
 
// Security setup for helmet & cors
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
 
// Connect to MongoDB cluster
connectToDB();
 
// Standard middleware with limit configured to prevent DoS
app.use(express.json({ limit: "10kb" }));
 
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
 
// Error handling: 404 first so unmatched routes reach the error handler,
// then the centralized error handler last
app.use(errorHandler404);
app.use(errorHandler);
 
module.exports = app;
