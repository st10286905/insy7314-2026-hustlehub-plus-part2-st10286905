// AI Disclosure: These tests were ported by Gemini from my demo.sh / test.sh bash script https://share.gemini.google/OJiZK7qAvE3p

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../../src/app");
const UserModel = require("../../src/models/user.model");

describe("Auth Integration Tests", () => {
  let server;
  let baseUrl;
  let authToken;

  const testUser = {
    email: `test_${Date.now()}@hustlehub.co.za`,
    password: "SecurePassword123!",
    role: "freelancer",
  };

  // Centralised wrapper around native fetch to simplify request dispatching
  async function request(path, { method = "GET", body, headers = {} } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);
    return { status: res.status, body: data };
  }

  before(async () => {
    // Clear in-memory storage so runs remain deterministic
    await UserModel.clear();

    // Bind to port 0 to let the OS assign an unused ephemeral port
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe("POST /api/auth/register", () => {
    it("rejects registration with an invalid email", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          email: "not-an-email",
          password: testUser.password,
          role: testUser.role,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "VALIDATION_ERROR");
    });

    it("rejects registration with a weak password", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          email: testUser.email,
          password: "123",
          role: testUser.role,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "VALIDATION_ERROR");
    });

    it("rejects registration when email is missing", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          password: testUser.password,
          role: testUser.role,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "VALIDATION_ERROR");
    });

    it("registers a new user account successfully", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: testUser,
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body?.user?.email, testUser.email);
    });

    it("rejects duplicate email registrations with a 409 conflict", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: testUser,
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body?.error?.code, "DUPLICATE_EMAIL");
    });
  });

  describe("POST /api/auth/login", () => {
    it("authenticates valid credentials and issues a JWT", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.user?.email, testUser.email);
      assert.ok(
        typeof res.body?.token === "string",
        "Expected response to contain a JWT string",
      );

      authToken = res.body.token;
    });
  });

  describe("GET /api/auth/me", () => {
    it("denies access when no authorization header is supplied", async () => {
      const res = await request("/api/auth/me");

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body?.error?.code, "UNAUTHORIZED");
    });

    it("permits access when a valid bearer token is present", async () => {
      assert.ok(authToken, "Test requires an active token from the login step");

      const res = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.user?.email, testUser.email);
    });

    it("denies access when the bearer token signature is invalid", async () => {
      const res = await request("/api/auth/me", {
        headers: { Authorization: "Bearer malformed.or.invalid.token" },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body?.error?.code, "INVALID_TOKEN");
    });
  });
});
