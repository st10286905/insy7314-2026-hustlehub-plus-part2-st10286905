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
const {body, param, query, validationResult} = require('express-validator');

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
 * Validation rules for gig creation
 * Validates:
 * - email
 * - password
 */
const gigValidation = [
    rejectUnknownFields(['title', 'category', 'description', 'rate', 'durationHours']),

    body('title')
    .exists({checkFalsy: true}).withMessage('Title is required')
    .bail().isString().withMessage('Title must be a string')
    .bail().isLength({max: 120}).withMessage('Title is invalid'),

    body('category')
    .exists({checkFalsy: true}).withMessage('Category is required')
    .bail().isString().withMessage('Category ID must be a string')
    .isIn(['Development', 'Design', 'Writing', 'Marketing', 'Other']).withMessage('Category is invalid'),

    body('description')
    .exists({checkFalsy: true}).withMessage('Description is required')
    .bail().isString().withMessage('Description must be a string')
    .bail().isLength({max: 2000}).withMessage('Description must be less than or equal to 2000 characters'),

    body('rate')
    .exists({checkFalsy: true}).withMessage('Rate is required')
    .bail().isNumeric({min: 1}).withMessage('Rate must be greater than R1'),

    body('durationHours')
    .exists({checkFalsy: true}).withMessage('Duration is required')
    .bail().isNumeric({min: 1, max: 40}).withMessage('Duration must be between 1 and 40 hours'),
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

const gigSearchValidation = [
  query('search')
    .default('')
    .isString().withMessage('search must be a string').bail()
    .trim()
    .isLength({ max: 100 }).withMessage('search must be 100 characters or fewer'),

  query('category')
    .optional()                                  
    .isString().withMessage('category must be a string').bail()
    .trim()
    .isIn(['Development', 'Design', 'Writing', 'Marketing', 'Other']) 
    .withMessage('Invalid category'),

  query('minRate')
    .optional()
    .isString().bail()                            
    .isFloat({ min: 1 }).withMessage('minRate must be a number greater than or equal to 1')
    .toFloat(),

  query('maxRate')
    .optional()
    .isString().bail()
    .isFloat({ min: 1 }).withMessage('maxRate must be a number greater than or equal to 1')
    .toFloat()
    .custom((max, { req }) => {
      const min = req.query.minRate;
      if (min !== undefined && max < min) {
        throw new Error('maxRate must be greater than or equal to minRate');
      }
      return true;
    }),

  query('page')
    .default('1')
    .isString().bail()
    .isInt({ min: 1 }).withMessage('page number must be equal to one or greater')
    .toInt(),

  query('limit')
    .default('10')
    .isString().bail()
    .isInt({ min: 10, max: 50 }).withMessage('limit must be between 10 and 50')
    .toInt(),
    handleValidationErrors,
];

const aggregationQueryValidation = [
  query('page')
    .default('1')
    .isString().bail()
    .isInt({ min: 1 }).withMessage('page number must be equal to one or greater')
    .toInt(),

  query('limit')
    .default('10')
    .isString().bail()
    .isInt({ min: 10, max: 50 }).withMessage('limit must be between 10 and 50')
    .toInt(),
    handleValidationErrors,
];


const gigUpdateValidation = [
  param("id").isString().withMessage("Invalid gig id"),
  rejectUnknownFields(['title', 'category', 'description', 'rate', 'durationHours', 'status']),
  body("title")
    .exists({ values: "null" }).withMessage("title is required").bail()
    .isString().withMessage("title must be a string").bail()
    .trim()
    .isLength({ min: 1, max: 120 }).withMessage("title must be 1-120 characters"),

  body("category")
    .exists({ values: "null" }).withMessage("category is required").bail()
    .isString().withMessage("category must be a string").bail()
    .trim()
    .isIn(["Development", "Design", "Writing", "Marketing", "Other"])
    .withMessage("Invalid category"),

  body("description")
    .exists({ values: "null" }).withMessage("description is required").bail()
    .isString().withMessage("description must be a string").bail()
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage("description must be 1-2000 characters"),

  body("rate")
    .exists({ values: "null" }).withMessage("rate is required").bail()
    .custom((v) => typeof v === "number").withMessage("rate must be a number").bail()
    .isFloat({ min: 1 }).withMessage("rate must be at least 1")
    .toFloat(),

  body("durationHours")
    .exists({ values: "null" }).withMessage("durationHours is required").bail()
    .custom((v) => typeof v === "number").withMessage("durationHours must be a number").bail()
    .isInt({ min: 1 }).withMessage("durationHours must be an integer >= 1")
    .toInt(),

  body("status")
    .exists({ values: "null" }).withMessage("status is required").bail()
    .isString().withMessage("status must be a string").bail()
    .isIn(["Active", "Paused"]).withMessage("status must be Active or Paused"),
    handleValidationErrors,
];

const validateGigIdRouteParam = [
    param("id").isString().withMessage("Invalid gig id"),
    handleValidationErrors,
];

module.exports = {
    registerValidation,
    loginValidation,
    gigValidation,
    gigSearchValidation,
    gigUpdateValidation,
    validateGigIdRouteParam,
    aggregationQueryValidation,
    bookingValidation
};
