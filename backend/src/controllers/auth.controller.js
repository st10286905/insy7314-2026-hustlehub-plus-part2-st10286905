/**
 * @file auth.controller.js
 * @description Auth API controllers: user registration, login, and the
 * protected current-user endpoint.
 * Code based on the following source:
 *
 * https://www.npmjs.com/package/bcrypt
 * https://www.npmjs.com/package/jsonwebtoken
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");
const UserModel = require("../models/user.model");
const User = require("../models/user")

const SALT_ROUNDS = 12;

/**
 * Register a new user. Rejects duplicate emails and returns the created user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const assignableRoles = ['freelancer', 'client'];

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({
        error: {
          code: "DUPLICATE_EMAIL",
          message: "An account with this email address already exists.",
        },
      });
    
    if(!assignableRoles.includes(role))
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "User registration has invalid role.",
        },
      });

    const newUser = await User.create({
      name,
      email,
      password,
      role: role
    });

    return res.status(201).json({
      message: "User successfully registered.",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticate a user and issue a signed JWT on success.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verify whether user exists
    const user = await User.findOne({email});
    if (!user)
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });

    // Verify hash of given password matches stored passwordHash
    const pwMatch = await bcrypt.compare(password, user.password);
    if (!pwMatch)
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });

    // Mint token
    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      config.jwt.secret,
      { expiresIn: "1h" },
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Return the authenticated user's profile from the token payload.
 * @param {Object} req - The request object (req.user set by auth middleware).
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.me = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user)
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User not found." },
      });

    const { passwordHash, ...safeUserData } = user;
    return res.status(200).json({ user: safeUserData });
  } catch (err) {
    next(err);
  }
};
