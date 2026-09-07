const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth");

const { registerValidation, loginValidation } = require("../middleware/validation");

// Public routes
/**
 * Register a new user
 * 
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", registerValidation, authController.register);

/**
 * Login a user
 * 
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post("/login", loginValidation, authController.login);

// Protected routes (require valid JWT)
/**
 * Get current user details
 * 
 * @route GET /api/auth/me
 * @desc Get current user details
 * @access Private
 */
router.get("/me", authenticate, authController.me);

module.exports = router;
