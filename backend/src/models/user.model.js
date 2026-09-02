const crypto = require("crypto");

// Use in-memory store for now
const users = new Map();

class UserModel {
  static async findByEmail(email) {
    for (const user of users.values())
      if (user.email.toLowerCase() === email.toLowerCase()) return user;

    return null;
  }

  static async findById(id) {
    return users.get(id) || null;
  }

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

  static async clear() {
    users.clear();
  }
}

module.exports = UserModel;
