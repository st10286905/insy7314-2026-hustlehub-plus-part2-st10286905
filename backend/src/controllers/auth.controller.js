const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");

const SALT_ROUNDS = 12;

exports.register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate fields are present
    if (!email || !password)
      return res.status(400).json({
        error: {
          code: "MISSING_FIELDS",
          message: "Email and password are required.",
        },
      });

    // Validate role is allowed
    const allowedRoles = ["client", "freelancer", "admin"];
    const assignedRole = role ? role.toLowerCase() : "client";
    if (!allowedRoles.includes(assignedRole))
      return res.status(400).json({
        error: {
          code: "INVALID_ROLE",
          message: "Role must be client, freelancer, or admin.",
        },
      });

    // Verify whether user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser)
      return res.status(409).json({
        error: {
          code: "DUPLICATE_EMAIL",
          message: "An account with this email address already exists.",
        },
      });

    // Hash password and create new user
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await UserModel.create({
      email,
      passwordHash,
      role: assignedRole,
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

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate fields are present
    if (!email || !password)
      return res.status(400).json({
        error: {
          code: "MISSING_FIELDS",
          message: "Email and password are required.",
        },
      });

    // Verify whether user exists
    const user = await UserModel.findByEmail(email);
    if (!user)
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });

    // Verify hash of given password matches stored passwordHash
    const pwMatch = await bcrypt.compare(password, user.passwordHash);
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
      process.env.JWT_SECRET,
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
