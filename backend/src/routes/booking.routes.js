const express = require("express");
const { authenticate, authorizeRoles} = require("../middleware/auth.middleware");
const { bookingValidation } = require("../middleware/validation.middleware");
const bookingController = require("../controllers/booking.controller");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorizeRoles("client"),
    bookingValidation,
    bookingController.create
)

module.exports = router;