const {body, validationResult} = require('express-validator');

const handleValidationErrors = (req, res, next) => {
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

const registerValidation = [
    body('email')
    .exists().withMessage('Email is required')
    .bail().isString().trim().isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),

    body('password')
    .exists().withMessage('Password is required')
    .bail().isString().trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

    body("role")
    .exists().withMessage('Role is required')
    .isString().withMessage('Role must be a string')
    .bail().trim().toLowerCase().isIn(['client', 'freelancer','admin']).withMessage('Role must be either "user", "freelancer" or "admin"'),

    handleValidationErrors,
];

const loginValidation = [
    body('email')
    .exists().withMessage('Email is required')
    .bail().isString().withMessage('Email must be a string')
    .bail().trim().isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),

    body('password')
    .exists().withMessage('Password is required')
    .bail().isString().withMessage('Password must be a string'),

    handleValidationErrors,
];

module.exports = {
    registerValidation,
    loginValidation,
};