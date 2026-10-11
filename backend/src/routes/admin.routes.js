const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const {
  aggregationQueryValidation
} = require("../middleware/validation.middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: A user account (password hash is never returned)
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         name:
 *           type: string
 *           example: Thandi Nkosi
 *         email:
 *           type: string
 *           format: email
 *           example: thandi@example.com
 *         role:
 *           type: string
 *           enum: [client, freelancer, admin]
 *           example: freelancer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Booking:
 *       type: object
 *       description: A booking of a gig by a client
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d3
 *         gig:
 *           type: string
 *           description: ObjectId of the booked gig
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         client:
 *           type: string
 *           description: ObjectId of the user who made the booking
 *           example: 64f1a2b3c4d5e6f7a8b9c0d4
 *         freelancer:
 *           type: string
 *           description: ObjectId of the freelancer who owns the gig
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         notes:
 *           type: string
 *           maxLength: 500
 *           example: Please send the first draft by Friday.
 *         status:
 *           type: string
 *           enum: [Pending, Confirmed, Completed, Cancelled]
 *           example: Pending
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
 *     Transaction:
 *       type: object
 *       description: A payment record linked to a booking
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d5
 *         booking:
 *           type: string
 *           description: ObjectId of the booking this payment belongs to
 *           example: 64f1a2b3c4d5e6f7a8b9c0d3
 *         client:
 *           type: string
 *           description: ObjectId of the user who paid
 *           example: 64f1a2b3c4d5e6f7a8b9c0d4
 *         freelancer:
 *           type: string
 *           description: ObjectId of the freelancer who is paid
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         amount:
 *           type: number
 *           format: double
 *           description: Amount of the transaction, in rand
 *           example: 1500.00
 *         status:
 *           type: string
 *           enum: [Pending, Completed, Refunded]
 *           example: Pending
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
 *     Stats:
 *       type: object
 *       description: Total document counts per collection
 *       properties:
 *         users:
 *           type: integer
 *           minimum: 0
 *           example: 42
 *         gigs:
 *           type: integer
 *           minimum: 0
 *           example: 18
 *         bookings:
 *           type: integer
 *           minimum: 0
 *           example: 31
 *         transactions:
 *           type: integer
 *           minimum: 0
 *           example: 27
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List users
 *     description: Returns a page of users. Requires a valid JWT and the admin role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of users per page.
 *     responses:
 *       200:
 *         description: A page of users (empty array if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get("/users", authenticate, authorizeRoles("admin"), aggregationQueryValidation, adminController.getUsers);

/**
 * @swagger
 * /api/admin/gigs:
 *   get:
 *     summary: List all gigs
 *     description: Returns a page of gigs of every status (Active and Paused) from all freelancers. Requires a valid JWT and the admin role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of gigs per page.
 *     responses:
 *       200:
 *         description: A page of gigs (empty array if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gigs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Gig'
 */
router.get("/gigs", authenticate, authorizeRoles("admin"), aggregationQueryValidation, adminController.getGigs);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: List all bookings
 *     description: Returns a page of bookings. Requires a valid JWT and the admin role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of bookings per page.
 *     responses:
 *       200:
 *         description: A page of bookings (empty array if none)
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
router.get("/bookings", authenticate, authorizeRoles("admin"), aggregationQueryValidation, adminController.getBookings);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: List all transactions
 *     description: Returns a page of transactions. Requires a valid JWT and the admin role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of transactions per page.
 *     responses:
 *       200:
 *         description: A page of transactions (empty array if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */
router.get("/transactions", authenticate, authorizeRoles("admin"), aggregationQueryValidation, adminController.getTransactions);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform totals
 *     description: Returns the total number of users, gigs, bookings and transactions. Requires a valid JWT and the admin role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document counts for each collection
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stats'
 */
router.get("/stats", authenticate, authorizeRoles("admin"), adminController.getStats);

module.exports = router;