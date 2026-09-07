/**
 * @file auth.test.js
 * @description Integration test suite for the auth endpoints using the node:test
 * runner and fetch against an in-process Express server.
 * Code based on the following source:
 *
 * https://nodejs.org/api/test.html
 * https://nodejs.org/api/assert.html
 * https://nodejs.org/api/http.html
 * https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
// AI Disclosure: based on postman collection and ported by https://share.gemini.google/FxpGj6jgOALG

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

  const httpTestUser = {
    email: `test_http_${Date.now()}@hustlehub.co.za`,
    password: "SecurePassword123!",
    role: "freelancer",
  };

  /**
   * Send a request to the test server and resolve with the status and parsed body.
   * @param {string} path - The request path.
   * @param {Object} [options] - The request options.
   * @param {string} [options.method="GET"] - The HTTP method.
   * @param {Object} [options.body] - The JSON request body.
   * @param {Object} [options.headers={}] - Extra headers.
   * @returns {Promise<{status: number, body: Object|null}>}
   */
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
    await UserModel.clear();
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
    it("rejects registration with an invalid email (Register - Invalid Email)", async () => {
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
      assert.ok(res.body?.error?.details?.some((d) => d.field === "email"));
    });

    it("rejects registration with a weak password (Register - Weak Password)", async () => {
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
      assert.ok(res.body?.error?.details?.some((d) => d.field === "password"));
    });

    it("rejects registration when email is missing (Register - Missing Email / Register No Email)", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          password: testUser.password,
          role: testUser.role,
        },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "VALIDATION_ERROR");
      const err = res.body?.error?.details?.find((d) => d.field === "email");
      assert.ok(err, "Email validation error must exist");
      assert.strictEqual(err.message, "Email is required");
    });

    it("rejects registration containing unknown fields (Register - Unknown Field)", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
          username: "not-allowed",
        },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "UNKNOWN_FIELDS");
      assert.ok(res.body?.error?.details?.some((d) => d.field === "username"));
    });

    it("registers a new user account successfully (Valid Register / Register - Successful Registration)", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: testUser,
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body?.message, "User successfully registered.");
      assert.strictEqual(res.body?.user?.email, testUser.email);
      assert.strictEqual(res.body?.user?.role, testUser.role);
      assert.strictEqual(res.body?.user?.passwordHash, undefined);
    });

    it("registers a new user account over HTTP (Valid Register No HTTPS)", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: httpTestUser,
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body?.message, "User successfully registered.");
      assert.strictEqual(res.body?.user?.email, httpTestUser.email);
      assert.strictEqual(res.body?.user?.role, httpTestUser.role);
    });

    it("rejects duplicate email registrations with a 409 conflict (Register Duplicate / Register - Duplicate Email)", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: testUser,
      });
      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body?.error?.code, "DUPLICATE_EMAIL");
    });
  });

  describe("POST /api/auth/login", () => {
    it("rejects login with an invalid email format (Login Invalid Email)", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "not-an-email",
          password: testUser.password,
        },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "VALIDATION_ERROR");
      assert.ok(res.body?.error?.details?.some((d) => d.field === "email"));
    });

    it("rejects login when password is missing (Login No Password)", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: testUser.email,
        },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "VALIDATION_ERROR");
      assert.ok(res.body?.error?.details?.some((d) => d.field === "password"));
    });

    it("rejects login when password exceeds maximum length (Login Invalid Password)", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: testUser.email,
          password: "A".repeat(129),
        },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "VALIDATION_ERROR");
      assert.ok(res.body?.error?.details?.some((d) => d.field === "password"));
    });

    it("rejects authentication with invalid credentials (Login - Invalid Credentials)", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: testUser.email,
          password: "WrongPassword123!",
        },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body?.error?.code, "INVALID_CREDENTIALS");
    });

    it("authenticates valid credentials and issues a JWT (Valid Login / Login - Valid)", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.message, "Login successful.");
      assert.strictEqual(res.body?.user?.email, testUser.email);
      assert.ok(
        typeof res.body?.token === "string" && res.body.token.length > 0,
        "Expected response to contain a non-empty JWT string",
      );
      authToken = res.body.token;
    });
  });

  describe("GET /api/auth/me", () => {
    it("denies access when no authorization header is supplied (GET /me - No Token / Me No Token)", async () => {
      const res = await request("/api/auth/me");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body?.error?.code, "UNAUTHORIZED");
    });

    it("denies access when the bearer token signature is invalid (GET /me - Invalid Token / Me Invalid Token)", async () => {
      const res = await request("/api/auth/me", {
        headers: { Authorization: "Bearer malformed.or.invalid.token" },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body?.error?.code, "INVALID_TOKEN");
    });

    it("permits access when a valid bearer token is present (GET /me - Valid Token / Me Valid Token)", async () => {
      assert.ok(authToken, "Test requires an active token from the login step");
      const res = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.user?.email, testUser.email);
      assert.strictEqual(res.body?.user?.passwordHash, undefined);
    });
  });
});
