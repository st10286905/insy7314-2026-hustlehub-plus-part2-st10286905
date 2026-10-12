/**
 * @file auth.routes.js
 * @description Auth route wiring: validation middleware, JWT authentication,
 * and controller handlers for the /api/auth endpoints.
 * Code based on the following source:
 *
 * https://www.npmjs.com/package/express
 * https://expressjs.com/en/4x/api/express/
 * https://expressjs.com/en/guide/writing-middleware/
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const {
  registerValidation,
  loginValidation,
} = require("../middleware/validation.middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisteredUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         email:
 *           type: string
 *           format: email
 *           example: jane.doe@example.com
 *         role:
 *           type: string
 *           enum: [client, admin]
 *           example: client
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-10-12T09:30:00.000Z
 */

// Public routes
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: >
 *       Creates a user account. The role defaults to `client` when omitted.
 *       Unknown fields are rejected. Public, no token required.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MySecretPassword123
 *               role:
 *                 type: string
 *                 enum: [client, admin]
 *                 default: client
 *                 example: client
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User successfully registered.
 *                 user:
 *                   $ref: '#/components/schemas/RegisteredUser'
 */
router.post("/register", registerValidation, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Verifies the user's email and password and returns a signed JWT (valid for 1 hour) along with basic user details.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MySecretPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   description: JWT access token (expires in 1 hour)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 64f1a2b3c4d5e6f7a8b9c0d1
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: jane.doe@example.com
 *                     role:
 *                       type: string
 *                       example: user
 */
router.post("/login", loginValidation, authController.login);

// Protected routes (require valid JWT)
/**
 * Get current user details
 *
 * @route GET /api/auth/me
 * @desc Get current user details
 * @access Private
 */
router.get("/me", authenticate, authController.me);

module.exports = router;
