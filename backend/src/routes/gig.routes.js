/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               description: Machine-readable error code
 *               example: NOT_FOUND
 *             message:
 *               type: string
 *               description: Human-readable error message
 *               example: Freelancer does not exist.
 *
 *     GigSummary:
 *       type: object
 *       description: Gig fields returned by the API
 *       properties:
 *         id:
 *           type: string
 *           description: MongoDB ObjectId of the gig
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         title:
 *           type: string
 *           example: Logo design for small businesses
 *         description:
 *           type: string
 *           example: I will design a modern logo with three concepts and two revisions.
 *         category:
 *           type: string
 *           example: Graphic Design
 *         rate:
 *           type: number
 *           format: double
 *           example: 25.5
 *         durationHours:
 *           type: integer
 *           example: 8
 *         status:
 *           type: string
 *           description: Current status of the gig
 *           example: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     GigCreationRequestBody:
 *       type: object
 *       description: Fields a client sends when creating a gig
 *       required:
 *         - freelancer
 *         - title
 *         - category
 *         - description
 *         - rate
 *         - durationHours
 *       properties:
 *         freelancer:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: MongoDB ObjectId of the freelancer who owns the gig
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 120
 *           description: Short title of the gig listing
 *           example: Logo design for small businesses
 *         category:
 *           type: string
 *           description: Category the gig belongs to
 *           example: Graphic Design
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Detailed description of what the gig includes
 *           example: I will design a modern logo with three concepts and two revisions.
 *         rate:
 *           type: number
 *           format: double
 *           minimum: 1
 *           description: Hourly rate charged for the gig
 *           example: 25.5
 *         durationHours:
 *           type: integer
 *           minimum: 1
 *           description: Estimated number of hours the gig takes
 *           example: 8
 */
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
const gigController = require("../controllers/gig.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const {
  gigValidation
} = require("../middleware/validation.middleware");


/**
 * @swagger
 * /api/gigs:
 *   post:
 *     summary: Create a new gig
 *     description: Creates a gig listing for an existing freelancer.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GigCreationRequestBody'
 *     responses:
 *       201:
 *         description: Gig successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gig successfully created.
 *                 gig:
 *                   $ref: '#/components/schemas/GigSummary'
 *       400:
 *         description: Validation failed (missing or invalid fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Freelancer does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Unexpected server error
 */
router.post("/", gigValidation, authenticate, gigController.create);

/**
 * @swagger
 * /api/gigs/mine:
 *   get:
 *     summary: Get the authenticated user's gigs
 *     description: Returns all gigs belonging to the user identified by the JWT.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's gigs (empty array if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gigs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GigSummary'
 *       401:
 *         description: Missing, invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/mine", authenticate, gigController.mine);

// router.get("/:id");

// router.put("/:id");

// router.delete("/:id")

module.exports = router;
