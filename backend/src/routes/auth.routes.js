const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth");

const { registerValidation, loginValidation } = require("../middleware/validation");

// Public routes
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);

// Protected routes (require valid JWT)
router.get("/me", authenticate, authController.me);

module.exports = router;
