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
const bookingRoutes = require("./routes/booking.routes");
const transactionRoutes = require("./routes/transaction.routes");
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
        schemas: {
          Booking: {
            type: "object",
            description: "A booking created by an authenticated client.",
            properties: {
              _id: {
                type: "string",
                description: "MongoDB ObjectId of the booking.",
                example: "64f1a2b3c4d5e6f7a8b9c0d3",
              },
              gig: {
                type: "string",
                description: "MongoDB ObjectId of the booked gig.",
                example: "64f1a2b3c4d5e6f7a8b9c0d2",
              },
              client: {
                type: "string",
                description: "MongoDB ObjectId of the client.",
                example: "64f1a2b3c4d5e6f7a8b9c0d1",
              },
              freelancer: {
                type: "string",
                description: "MongoDB ObjectId of the freelancer.",
                example: "64f1a2b3c4d5e6f7a8b9c0d4",
              },
              notes: {
                type: "string",
                maxLength: 500,
                description: "Optional booking requirements or notes.",
                example: "Please have the first draft ready within three days.",
              },
              status: {
                type: "string",
                enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
                example: "Confirmed",
              },
              createdAt: {
                type: "string",
                format: "date-time",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
              },
              __v: {
                type: "integer",
                example: 0,
              },
            },
          },
        },
      },
    },
    // Absolute path so it works regardless of where Node is started from
    apis: [path.join(__dirname, "routes", "*.js")],
  });
 
  app.get("/api-docs/openapi.json", (req, res) => {
    res.json(swaggerSpec);
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
app.use("/api/bookings", bookingRoutes);
app.use("/api/transactions", transactionRoutes);

// Error handling middleware
app.use(errorHandler);
app.use(errorHandler404);
app.use(errorHandler);
 
module.exports = app;
