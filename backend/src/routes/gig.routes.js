const express = require("express");
const router = express.Router();
const gigController = require("../controllers/gig.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const {
  gigValidation,
  gigSearchValidation,
  gigUpdateValidation,
  validateGigIdRouteParam
} = require("../middleware/validation.middleware");


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

/**
 * @swagger
 * /api/gigs/{id}:
 *   get:
 *     summary: Get an active gig by id
 *     description: >
 *       Returns an active gig. If the token belongs to a freelancer, the gig is
 *       only returned when it belongs to that freelancer. Other roles can view
 *       any active gig.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: MongoDB ObjectId of the gig
 *         example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     responses:
 *       200:
 *         description: The matching gig
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gig:
 *                   $ref: '#/components/schemas/GigSummary'
 *       400:
 *         description: Invalid gig id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Missing, invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Gig not found, not active, or not owned by the freelancer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", gigController.getGigByID);

/**
 * @swagger
 * /api/gigs:
 *   get:
 *     summary: Search and list gigs
 *     description: Returns a paginated list of gigs, optionally filtered by search text, category, and rate range.
 *     tags: [Gigs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *           default: ""
 *         description: Text to match against the gig title (case-insensitive).
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Development, Design, Writing, Marketing, Other]
 *         description: Filter by category.
 *       - in: query
 *         name: minRate
 *         schema:
 *           type: number
 *           minimum: 1
 *         description: Minimum rate (inclusive).
 *       - in: query
 *         name: maxRate
 *         schema:
 *           type: number
 *           minimum: 1
 *         description: Maximum rate (inclusive). Must be >= minRate.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 10
 *           maximum: 50
 *           default: 10
 *         description: Number of results per page.
 *     responses:
 *       200:
 *         description: A list of gigs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gigs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GigSummary'
 *       400:
 *         description: Validation failed (bad type, out of range, invalid category, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Unexpected server error
 */
router.get("/", gigSearchValidation, gigController.getGigs);


/**
 * @swagger
 * /api/gigs/{id}:
 *   put:
 *     summary: Update a gig
 *     description: Replaces all editable fields of an existing gig. Requires a valid JWT. Every field is required and unknown fields are rejected.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: MongoDB ObjectId of the gig
 *         example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - title
 *               - category
 *               - description
 *               - rate
 *               - durationHours
 *               - status
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 120
 *                 example: Logo design for small businesses
 *               category:
 *                 type: string
 *                 enum: [Development, Design, Writing, Marketing, Other]
 *                 example: Design
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: I will design a modern logo with three concepts and two revisions.
 *               rate:
 *                 type: number
 *                 format: double
 *                 minimum: 1
 *                 example: 25.5
 *               durationHours:
 *                 type: integer
 *                 minimum: 1
 *                 example: 8
 *               status:
 *                 type: string
 *                 enum: [Active, Paused]
 *                 example: Active
 *     responses:
 *       200:
 *         description: Gig updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gig:
 *                   $ref: '#/components/schemas/GigSummary'
 *       400:
 *         description: Validation failed (invalid id, missing field, wrong type, or unknown field)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Missing, invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Gig not found, or not owned by the freelancer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Unexpected server error
 */
router.put("/:id", authenticate, gigUpdateValidation, gigController.updateGigByID);

/**
 * @swagger
 * /api/gigs/{id}:
 *   delete:
 *     summary: Delete a gig
 *     description: Permanently deletes a gig. Requires a valid JWT. If the token belongs to a freelancer, the gig is only deleted when it belongs to that freelancer.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: MongoDB ObjectId of the gig
 *         example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     responses:
 *       200:
 *         description: Gig deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gig successfully deleted.
 *       400:
 *         description: Invalid gig id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Missing, invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Gig not found, or not owned by the freelancer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Unexpected server error
 */
router.delete("/:id", validateGigIdRouteParam, gigController.deleteGigByID);

module.exports = router;
