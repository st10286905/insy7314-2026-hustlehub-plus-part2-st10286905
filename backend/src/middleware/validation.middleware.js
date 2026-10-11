/**
 * @file validation.middleware.js
 * @description Middleware for validating request data using express-validator.
 * This file contains validation rules for user registration and login, as well as middleware to handle validation errors and reject unknown fields.
 * Code based on the following source:
 * 
 * https://express-validator.github.io/docs/api/validation-chain/
 * https://express-validator.github.io/docs/api/check/
 * https://express-validator.github.io/docs/api/validation-result/
 * https://express-validator.github.io/docs/guides/getting-started/
 * https://expressjs.com/en/guide/writing-middleware/
 * https://expressjs.com/en/4x/api/response/
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Quantifier
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Lookahead_assertion
 */
const {body, validationResult} = require('express-validator');

/**
 * Middleware that checks for validation errors in the request.
 * If validation errors exist, it returns a 400 Bad Request response with the error details.
 * If there are no validation errors, it passes control to the next middleware.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */

const handleValidationErrors = (req, res, next) => {
    // If validation errors exist, return a 400 Bad Request response with the error details
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: "Invalid request data",
                details: errors.array().map((error) => ({
                    field: error.path,
                    message: error.msg,
                })),
            },
        });
    }

    next();
}

/**
 * Middleware that checks for unknown fields in the request body.
 * If unknown fields are found, it returns a 400 Bad Request response with the error details.
 * 
 * @param {Array} allowedFields - An array of allowed field names.
 * @returns {Function} - A middleware function that checks for unknown fields.
 */
const rejectUnknownFields = (allowedFields) => {
    return (req, res, next) => {
        const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
        if (unknownFields.length > 0) {
            return res.status(400).json({ 
                error: {
                    code: 'UNKNOWN_FIELDS',
                    message: `Request contains unsupported fields`,
                    details: unknownFields.map((field) => ({
                        field,
                        message: `Field "${field}" is not allowed`,
                    })),
                }
            });
        }
        next();
    };
};

/**
 * Validation rules for user registration.
 * Validates:
 * - email
 * - password
 * - role (optional)
 */
const registerValidation = [
    rejectUnknownFields(['name', 'email', 'password', 'role']),
    body('name')
    .exists({checkFalsy: true}).withMessage('Name is required'),
    
    body('email')
    .exists({checkFalsy: true}).withMessage('Email is required')
    .bail().trim().isLength({max:254}).withMessage('Email must not exceed 254 characters')
    .bail().isString().withMessage('Email must be a string')
    .bail().trim().isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),

    body('password')
    .exists({checkFalsy: true}).withMessage('Password is required')
    .bail().isString().withMessage('Password must be a string')
    .bail().matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/).withMessage('Password must be complex and between 8 to 128 characters'),

    body("role")
    .optional()
    .isString().withMessage('Role must be a string')
    .bail().trim().toLowerCase().isIn(['client', 'freelancer','admin']).withMessage('Role must be either "client", "freelancer" or "admin"'),

    handleValidationErrors,
];

/**
 * Validation rules for user login.
 * Validates:
 * - email
 * - password
 */
const loginValidation = [
    rejectUnknownFields(['email', 'password']),
    body('email')
    .exists({checkFalsy: true}).withMessage('Email is required')
    .bail().isString().withMessage('Email must be a string')
    .bail().trim().isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),

    body('password')
    .exists({checkFalsy: true}).withMessage('Password is required')
    .bail().isString().withMessage('Password must be a string')
    .bail().isLength({max: 128}).withMessage('Password is invalid'),

    handleValidationErrors,
];

/**
 * Validation rules for booking a gig.
 * Validates:
 * - gig (required, must be a valid MongoDB ObjectId)
 * - notes (optional, must be a string and not exceed 500 characters)
 */
const bookingValidation = [
    rejectUnknownFields(["gig", "notes"]),

    body("gig").trim().notEmpty().withMessage("Gig ID is required").isMongoId().withMessage("Gig ID must be a valid MongoDB ObjectId"),
    body("notes").optional().isString().withMessage("Notes must be a string").isLength({max: 500}).withMessage("Notes must not exceed 500 characters"),

    handleValidationErrors,
];

module.exports = {
    registerValidation,
    loginValidation,
    bookingValidation,
};
