const express = require("express");
const router = express.Router();
const gigController = require("../controllers/gig.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const {
  gigValidation,
  gigSearchValidation,
  gigUpdateValidation,
  validateGigIdRouteParam,
} = require("../middleware/validation.middleware");

/**
 * @file gig.routes.js
 * @description Gig route wiring: validation, JWT authentication, role checks
 * and controller handlers for the /api/gigs endpoints.
 * Code based on the following sources:
 *
 * https://www.npmjs.com/package/express
 * https://expressjs.com/en/4x/api/express/
 * https://expressjs.com/en/guide/writing-middleware/
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     GigId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         pattern: '^[a-fA-F0-9]{24}$'
 *       description: MongoDB ObjectId of the gig
 *       example: 64f1a2b3c4d5e6f7a8b9c0d2
 *
 *   responses:
 *     ValidationError:
 *       description: Validation failed (invalid id, missing field, wrong type or unknown field)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Unauthorized:
 *       description: Missing, malformed, invalid or expired token
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Forbidden:
 *       description: The user's role is not allowed to perform this action
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     ServerError:
 *       description: Unexpected server error
 *
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
 *               example: Gig not found.
 *
 *     Gig:
 *       type: object
 *       description: A gig document as stored in MongoDB
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         freelancer:
 *           type: string
 *           description: ObjectId of the user who owns the gig
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         title:
 *           type: string
 *           maxLength: 120
 *           example: Logo design for small businesses
 *         category:
 *           type: string
 *           enum: [Development, Design, Writing, Marketing, Other]
 *           example: Design
 *         description:
 *           type: string
 *           maxLength: 2000
 *           example: I will design a modern logo with three concepts and two revisions.
 *         rate:
 *           type: number
 *           format: double
 *           minimum: 1
 *           description: Rate charged for the gig, in rand
 *           example: 250.5
 *         durationHours:
 *           type: integer
 *           minimum: 1
 *           maximum: 40
 *           example: 8
 *         status:
 *           type: string
 *           enum: [Active, Paused]
 *           example: Active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         __v:
 *           type: integer
 *           example: 0
 *
 *     GigSummary:
 *       type: object
 *       description: Trimmed gig returned by the create endpoint
 *       properties:
 *         id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         title:
 *           type: string
 *           example: Logo design for small businesses
 *         category:
 *           type: string
 *           enum: [Development, Design, Writing, Marketing, Other]
 *           example: Design
 *         description:
 *           type: string
 *           example: I will design a modern logo with three concepts and two revisions.
 *         rate:
 *           type: number
 *           format: double
 *           example: 250.5
 *         durationHours:
 *           type: integer
 *           example: 8
 *         status:
 *           type: string
 *           enum: [Active, Paused]
 *           example: Active
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     GigCreateRequest:
 *       type: object
 *       description: Fields sent when creating a gig. The owner is taken from the JWT.
 *       required: [title, category, description, rate, durationHours]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 120
 *           example: Logo design for small businesses
 *         category:
 *           type: string
 *           enum: [Development, Design, Writing, Marketing, Other]
 *           example: Design
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           example: I will design a modern logo with three concepts and two revisions.
 *         rate:
 *           type: number
 *           format: double
 *           minimum: 1
 *           example: 250.5
 *         durationHours:
 *           type: integer
 *           minimum: 1
 *           maximum: 40
 *           example: 8
 *
 *     GigUpdateRequest:
 *       type: object
 *       description: Full replacement of the editable fields. All fields are required and unknown fields are rejected.
 *       additionalProperties: false
 *       required: [title, category, description, rate, durationHours, status]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 120
 *           example: Logo design for small businesses
 *         category:
 *           type: string
 *           enum: [Development, Design, Writing, Marketing, Other]
 *           example: Design
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           example: I will design a modern logo with three concepts and two revisions.
 *         rate:
 *           type: number
 *           format: double
 *           minimum: 1
 *           example: 250.5
 *         durationHours:
 *           type: integer
 *           minimum: 1
 *           maximum: 40
 *           example: 8
 *         status:
 *           type: string
 *           enum: [Active, Paused]
 *           example: Active
 */

/**
 * @swagger
 * /api/gigs:
 *   post:
 *     summary: Create a new gig
 *     description: Creates a gig owned by the authenticated user. Requires the freelancer or admin role.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GigCreateRequest'
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
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: The authenticated user no longer exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/", authenticate, authorizeRoles("freelancer", "admin"), gigValidation, gigController.create);

/**
 * @swagger
 * /api/gigs/mine:
 *   get:
 *     summary: Get the authenticated user's gigs
 *     description: Returns all gigs (Active and Paused) owned by the user identified by the JWT.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's gigs (empty array if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gigs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Gig'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/mine", authenticate, authorizeRoles("freelancer"), gigController.mine);

/**
 * @swagger
 * /api/gigs/{id}:
 *   get:
 *     summary: Get an active gig by id
 *     description: >
 *       Returns an Active gig. If the token belongs to a freelancer, the gig is
 *       only returned when it belongs to that freelancer. Other roles can view
 *       any Active gig.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/GigId'
 *     responses:
 *       200:
 *         description: The matching gig
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gig'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Gig not found, not Active, or not owned by the freelancer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", authenticate, authorizeRoles("freelancer", "admin"), gigController.getGigByID);

/**
 * @swagger
 * /api/gigs:
 *   get:
 *     summary: Search and list gigs
 *     description: Returns a page of gigs, optionally filtered by title text, category and rate range. Public, no token required.
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
 *         description: Matching gigs (empty array if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gig'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", gigSearchValidation, gigController.getGigs);

/**
 * @swagger
 * /api/gigs/{id}:
 *   put:
 *     summary: Update a gig
 *     description: >
 *       Replaces all editable fields of a gig. Requires a valid JWT. If the
 *       token belongs to a freelancer, only their own gigs can be updated.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/GigId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GigUpdateRequest'
 *     responses:
 *       200:
 *         description: The updated gig
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gig'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Gig not found, or not owned by the freelancer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id", authenticate, authorizeRoles("freelancer", "admin"), gigUpdateValidation, gigController.updateGigByID);

/**
 * @swagger
 * /api/gigs/{id}:
 *   delete:
 *     summary: Delete a gig
 *     description: >
 *       Permanently deletes a gig. Requires a valid JWT. If the token belongs
 *       to a freelancer, only their own gigs can be deleted.
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/GigId'
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
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Gig not found, or not owned by the freelancer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id", authenticate, validateGigIdRouteParam, authorizeRoles("freelancer", "admin"), gigController.deleteGigByID);

module.exports = router;