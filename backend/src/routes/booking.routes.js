const express = require("express");
const { authenticate, authorizeRoles} = require("../middleware/auth.middleware");
const { bookingValidation } = require("../middleware/validation.middleware");
const bookingController = require("../controllers/booking.controller");
const { bookingRateLimiter } = require("../middleware/rate-limit.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/bookings/mine:
 *   get:
 *     summary: Get the authenticated freelancer's bookings
 *     description: Returns all bookings where the authenticated user is the freelancer. Requires a valid JWT and the freelancer role.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The freelancer's bookings (empty array if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 */
router.get(
    "/mine",
    authenticate,
    authorizeRoles("freelancer"),
    bookingController.mine
)

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Creates a new booking for the authenticated client
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: The booking was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/",
    authenticate,
    authorizeRoles("client"),
    bookingRateLimiter,
    bookingValidation,
    bookingController.create
)
module.exports = router;