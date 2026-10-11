const express = require("express");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const router = express.Router();

router.get(
    "/income",
    authenticate,
    authorizeRoles("freelancer"),
    transactionController.income
);

module.exports = router;