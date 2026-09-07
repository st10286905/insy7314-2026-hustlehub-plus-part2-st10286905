// AI Disclosure: .sh scripts ported by https://share.gemini.google/Mz0xUeqIrTaI

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const dotenv = require("dotenv");
const init = require("./init");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");

// Visual output styling and ANSI terminal codes
const GREEN = "\x1b[0;32m";
const RED = "\x1b[0;31m";
const CYAN = "\x1b[0;36m";
const YELLOW = "\x1b[0;33m";
const BLUE = "\x1b[0;34m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const NC = "\x1b[0m";

const DIVIDER = "────────────────────────────────────────────────────────────";
const DOUBLE_DIVIDER =
  "============================================================";
const SINGLE_DIVIDER =
  "------------------------------------------------------------";

// Runtime handles populated dynamically during initialisation
let app;
let server;
let baseUrl;
let cert;
let isHttps;
let keyPath;
let certPath;

// Test execution tracking
let passed = 0;
let failed = 0;
let testIndex = 0;
let lastBody = null;
let authToken = "";

const testTitles = [];
const testStatuses = [];
const testDetails = [];

const timestamp = Math.floor(Date.now() / 1000);
const testEmail = `test_${timestamp}@hustlehub.co.za`;
const testPassword = "SecurePassword123!";

// Format JSON or raw response strings with consistent indentation
function formatBody(content) {
  const indent = "    ";
  if (content === null || content === undefined) {
    return `${indent}${DIM}(empty)${NC}`;
  }

  if (typeof content === "object") {
    if (Object.keys(content).length === 0) {
      return `${indent}${DIM}(empty)${NC}`;
    }
    return JSON.stringify(content, null, 2)
      .split("\n")
      .map((line) => `${indent}${line}`)
      .join("\n");
  }

  const trimmed = String(content).trim();
  if (!trimmed) {
    return `${indent}${DIM}(empty)${NC}`;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2)
      .split("\n")
      .map((line) => `${indent}${line}`)
      .join("\n");
  } catch {
    return trimmed
      .split("\n")
      .map((line) => `${indent}${line}`)
      .join("\n");
  }
}

// Dispatch an HTTP or HTTPS network request with optional certificate authority verification
function sendRequest(method, endpoint, payload = null, authHeader = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const transport = isHttps ? https : http;

    const headers = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const reqOptions = {
      method,
      headers,
      ca: isHttps ? cert : undefined,
    };

    const req = transport.request(url, reqOptions, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch {
          parsed = data;
        }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on("error", reject);

    if (payload) {
      req.write(
        typeof payload === "string" ? payload : JSON.stringify(payload),
      );
    }
    req.end();
  });
}

// Execute a single test case with detailed visual request and response logging
async function assertRequest(
  title,
  expectedStatus,
  method,
  pathUrl,
  payload = null,
  authHeader = null,
  validatorFn = null,
  filterDesc = "",
) {
  testIndex++;
  const fullUrl = `${baseUrl}${pathUrl}`;
  testTitles.push(title);

  console.log(`${BOLD}${BLUE}${DIVIDER}${NC}`);
  console.log(`${BOLD}Test ${testIndex}: ${title}${NC}`);
  console.log(`${BOLD}${BLUE}${DIVIDER}${NC}`);

  // Format and log request details
  console.log(`${CYAN}${BOLD}> REQUEST${NC}`);
  console.log(`  ${BOLD}Endpoint:${NC} ${method} ${fullUrl}`);
  console.log(`  ${BOLD}Headers:${NC}  Content-Type: application/json`);
  if (authHeader) {
    console.log(`            Authorization: ${authHeader}`);
  }
  if (payload) {
    console.log(`  ${BOLD}Payload:${NC}`);
    console.log(formatBody(payload));
  }

  // Dispatch network request
  const { statusCode, body } = await sendRequest(
    method,
    pathUrl,
    payload,
    authHeader,
  );
  lastBody = body;

  // Format and log response details
  console.log(`\n${YELLOW}${BOLD}< RESPONSE${NC}`);
  console.log(`  ${BOLD}HTTP Status:${NC} ${statusCode}`);
  console.log(`  ${BOLD}Body:${NC}`);
  console.log(formatBody(body));

  // Evaluate status code and schema assertions
  let errorMsg = "";
  if (statusCode !== expectedStatus) {
    errorMsg = `Expected HTTP ${expectedStatus}, received ${statusCode}`;
  } else if (validatorFn && !validatorFn(body)) {
    errorMsg = `Assertion failed for filter: ${filterDesc}`;
  }

  console.log("");
  if (!errorMsg) {
    console.log(
      `  ${GREEN}${BOLD}✔ PASS${NC} (HTTP ${statusCode} matched expected ${expectedStatus})`,
    );
    testStatuses.push("PASS");
    testDetails.push(`HTTP ${statusCode}`);
    passed++;
  } else {
    console.log(`  ${RED}${BOLD}✖ FAIL${NC} (${errorMsg})`);
    testStatuses.push("FAIL");
    testDetails.push(errorMsg);
    failed++;
  }
  console.log("");
}

// Coordinate initialisation, server startup, and the integration test suite
async function runSuite() {
  // Ensure environment files and TLS certificates are configured
  await init();

  // Load environment variables into process.env now that the file exists
  dotenv.config({ path: envPath, override: true });

  // Resolve configuration and paths from environment variables
  isHttps = process.env.USE_HTTPS === "true";
  keyPath = path.resolve(
    rootDir,
    process.env.SSL_KEY_PATH || "secrets/localhost-key.pem",
  );
  certPath = path.resolve(
    rootDir,
    process.env.SSL_CERT_PATH || "secrets/localhost-cert.pem",
  );

  // Import the Express application after environment variables are populated
  app = require("../src/app");

  // Start the HTTP or HTTPS server based on configuration
  const serverCmd = "node src/server.js";
  console.log(`${BOLD}Starting server: \`${serverCmd}\`${NC}`);

  if (isHttps) {
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.error(
        `${RED}${BOLD}TLS certificates missing. Run 'npm run init' before testing.${NC}`,
      );
      process.exit(1);
    }
    cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    server = https.createServer({ key, cert }, app);
  } else {
    server = http.createServer(app);
  }

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `${isHttps ? "https" : "http"}://localhost:${port}`;

  console.log(
    `Waiting for server to accept connections at ${baseUrl}... ${GREEN}[READY]${NC} (PID: ${process.pid})\n`,
  );
  console.log(`${BOLD}--- Starting Integration Test Suite ---${NC}\n`);

  // Validation: Malformed email syntax
  const invalidEmailPayload = {
    email: "not-an-email",
    password: testPassword,
    role: "freelancer",
  };
  await assertRequest(
    "Reject registration with invalid email",
    400,
    "POST",
    "/api/auth/register",
    invalidEmailPayload,
    "",
    (b) => b?.error?.code === "VALIDATION_ERROR",
    '.error.code == "VALIDATION_ERROR"',
  );

  // Validation: Password complexity requirements
  const weakPasswordPayload = {
    email: testEmail,
    password: "123",
    role: "freelancer",
  };
  await assertRequest(
    "Reject registration with weak password",
    400,
    "POST",
    "/api/auth/register",
    weakPasswordPayload,
    "",
    (b) => b?.error?.code === "VALIDATION_ERROR",
    '.error.code == "VALIDATION_ERROR"',
  );

  // Validation: Missing required credentials
  const missingEmailPayload = {
    password: testPassword,
    role: "freelancer",
  };
  await assertRequest(
    "Reject registration with missing email",
    400,
    "POST",
    "/api/auth/register",
    missingEmailPayload,
    "",
    (b) => b?.error?.code === "VALIDATION_ERROR",
    '.error.code == "VALIDATION_ERROR"',
  );

  // User lifecycle: Account creation
  const registerPayload = {
    email: testEmail,
    password: testPassword,
    role: "freelancer",
  };
  await assertRequest(
    "Register new user account",
    201,
    "POST",
    "/api/auth/register",
    registerPayload,
    "",
    (b) => b?.user?.email === testEmail,
    `.user.email == "${testEmail}"`,
  );

  // User lifecycle: Enforce unique email constraint
  await assertRequest(
    "Reject duplicate account registration",
    409,
    "POST",
    "/api/auth/register",
    registerPayload,
    "",
    (b) => b?.error?.code === "DUPLICATE_EMAIL",
    '.error.code == "DUPLICATE_EMAIL"',
  );

  // Authentication: Credential verification and JWT issuance
  const loginPayload = {
    email: testEmail,
    password: testPassword,
  };
  await assertRequest(
    "Authenticate user and issue JWT",
    200,
    "POST",
    "/api/auth/login",
    loginPayload,
    "",
    (b) => Boolean(b?.token) && b?.user?.email === testEmail,
    `.token != null and .user.email == "${testEmail}"`,
  );

  authToken = lastBody?.token || "";
  if (!authToken) {
    console.log(
      `${RED}${BOLD}Aborting remaining tests: Failed to retrieve JWT token from login response.${NC}\n`,
    );
    await cleanupAndExit(1);
  }

  // Access control: Reject unauthenticated request to protected endpoint
  await assertRequest(
    "Deny access to /me without token",
    401,
    "GET",
    "/api/auth/me",
    null,
    "",
    (b) => b?.error?.code === "UNAUTHORIZED",
    '.error.code == "UNAUTHORIZED"',
  );

  // Access control: Permit authorized request with valid Bearer token
  await assertRequest(
    "Allow access to /me with valid Bearer token",
    200,
    "GET",
    "/api/auth/me",
    null,
    `Bearer ${authToken}`,
    (b) => b?.user?.email === testEmail,
    `.user.email == "${testEmail}"`,
  );

  // Access control: Reject malformed or invalid token signatures
  await assertRequest(
    "Deny access to /me with malformed token",
    401,
    "GET",
    "/api/auth/me",
    null,
    "Bearer malformed.or.invalid.token",
    (b) => b?.error?.code === "INVALID_TOKEN",
    '.error.code == "INVALID_TOKEN"',
  );

  // Render the final itemised summary dashboard
  const total = passed + failed;
  console.log(`${BOLD}${BLUE}${DOUBLE_DIVIDER}${NC}`);
  console.log(
    `${BOLD}                       TEST SUMMARY                         ${NC}`,
  );
  console.log(`${BOLD}${BLUE}${DOUBLE_DIVIDER}${NC}`);

  for (let i = 0; i < testTitles.length; i++) {
    if (testStatuses[i] === "PASS") {
      console.log(
        `  ${GREEN}${BOLD}${"✔ PASS".padEnd(6)}${NC}  ${testTitles[i]}`,
      );
    } else {
      console.log(
        `  ${RED}${BOLD}${"✖ FAIL".padEnd(6)}${NC}  ${testTitles[i]} ${RED}(${testDetails[i]})${NC}`,
      );
    }
  }

  console.log(`${BOLD}${BLUE}${SINGLE_DIVIDER}${NC}`);
  console.log(` Total Tests : ${total}`);
  console.log(` Passed      : ${GREEN}${passed}${NC}`);
  console.log(` Failed      : ${failed > 0 ? `${RED}${failed}${NC}` : "0"}`);

  if (failed === 0) {
    console.log(`\n${GREEN}${BOLD}ALL TESTS PASSED SUCCESSFULLY${NC}\n`);
    await cleanupAndExit(0);
  } else {
    console.log(`\n${RED}${BOLD}SOME TESTS FAILED${NC}\n`);
    await cleanupAndExit(1);
  }
}

// Clean up network listeners and terminate the process
async function cleanupAndExit(code) {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  process.exit(code);
}

// Top-level failure handling
runSuite().catch(async (err) => {
  console.error(`\n${RED}${BOLD}Unexpected Test Error:${NC}`, err);
  await cleanupAndExit(1);
});
