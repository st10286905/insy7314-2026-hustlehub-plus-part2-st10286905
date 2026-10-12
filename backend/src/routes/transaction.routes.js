const express = require("express");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     IncomeSummary:
 *       type: object
 *       properties:
 *         totalIncome:
 *           type: number
 *           format: double
 *           minimum: 0
 *           description: Sum of the amounts of Completed transactions, in rand (0 if none)
 *           example: 4500.00
 *         transactions:
 *           type: array
 *           description: All of the freelancer's transactions, whatever their status
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /api/transactions/income:
 *   get:
 *     summary: Get the authenticated freelancer's income
 *     description: >
 *       Returns every transaction where the authenticated user is the freelancer,
 *       plus the total of the Completed ones. Pending and Refunded transactions
 *       are listed but not counted in the total. Requires a valid JWT and the
 *       freelancer role.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total income and the freelancer's transactions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncomeSummary'
 */
router.get(
    "/income",
    authenticate,
    authorizeRoles("freelancer"),
    transactionController.income
);

module.exports = router;