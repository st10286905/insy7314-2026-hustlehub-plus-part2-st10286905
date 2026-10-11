const express = require("express");
const { authenticate, authorizeRoles} = require("../middleware/auth.middleware");
const { bookingValidation } = require("../middleware/validation.middleware");
const bookingController = require("../controllers/booking.controller");

const router = express.Router();

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
router.get(
    "/mine",
    authenticate,
    authorizeRoles("freelancer"),
    bookingController.mine
)

router.post(
    "/",
    authenticate,
    authorizeRoles("client"),
    bookingValidation,
    bookingController.create
)
module.exports = router;