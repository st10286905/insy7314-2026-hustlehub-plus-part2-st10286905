/**
 * @file user.model.js
 * @description In-memory user model backed by a Map, with simple CRUD
 * helpers used by the auth controllers.
 * Code based on the following source:
 *
 * https://nodejs.org/api/crypto.html
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
 */

const crypto = require("crypto");

// Use in-memory store for now
const users = new Map();

class UserModel {
  /**
   * Find a user by email (case-insensitive).
   * @param {string} email - The email to search for.
   * @returns {Promise<Object|null>} The user, or null if not found.
   */
  static async findByEmail(email) {
    for (const user of users.values())
      if (user.email.toLowerCase() === email.toLowerCase()) return user;

    return null;
  }

  /**
   * Find a user by id.
   * @param {string} id - The user id.
   * @returns {Promise<Object|null>} The user, or null if not found.
   */
  static async findById(id) {
    return users.get(id) || null;
  }

  /**
   * Create a new user with a generated id and ISO creation timestamp.
   * @param {Object} data - The user data.
   * @param {string} data.email - The user email (lowercased).
   * @param {string} data.passwordHash - The hashed password.
   * @param {string} [data.role="client"] - The user role.
   * @returns {Promise<Object>} The created user.
   */
  static async create({ email, passwordHash, role = "client" }) {
    const id = crypto.randomUUID();
    const newUser = {
      id,
      email: email.toLowerCase(),
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };
    users.set(id, newUser);
    return newUser;
  }

  /**
   * Remove all users from the in-memory store.
   * @returns {void}
   */
  static async clear() {
    users.clear();
  }
}

module.exports = UserModel;
