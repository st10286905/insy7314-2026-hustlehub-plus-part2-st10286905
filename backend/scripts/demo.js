// AI Disclosure: based on postman collection and ported by https://share.gemini.google/FxpGj6jgOALG

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const init = require("./init");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");

const GREEN = "\x1b[0;32m";
const RED = "\x1b[0;31m";
const CYAN = "\x1b[0;36m";
const YELLOW = "\x1b[0;33m";
const BLUE = "\x1b[0;34m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const NC = "\x1b[0m";
const DIVIDER = "------------------------------------------------------------";
const DOUBLE_DIVIDER =
  "============================================================";
const SINGLE_DIVIDER =
  "------------------------------------------------------------";

let app;
let server;
let httpServer;
let baseUrl;
let httpBaseUrl;
let cert;
let isHttps;
let keyPath;
let certPath;

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
const httpTestEmail = `test_http_${timestamp}@hustlehub.co.za`;
const testPassword = "SecurePassword123!";

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

function sendRequest(
  method,
  endpoint,
  payload = null,
  authHeader = null,
  targetBaseUrl = baseUrl,
) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, targetBaseUrl);
    const transport = url.protocol === "https:" ? https : http;
    const headers = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    const reqOptions = {
      method,
      headers,
      ca: url.protocol === "https:" ? cert : undefined,
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

async function assertRequest(
  title,
  expectedStatus,
  method,
  pathUrl,
  payload = null,
  authHeader = null,
  validatorFn = null,
  filterDesc = "",
  targetBaseUrl = baseUrl,
) {
  testIndex++;
  const fullUrl = `${targetBaseUrl}${pathUrl}`;
  testTitles.push(title);

  console.log(`${BOLD}${BLUE}${DIVIDER}${NC}`);
  console.log(`${BOLD}Test ${testIndex}: ${title}${NC}`);
  console.log(`${BOLD}${BLUE}${DIVIDER}${NC}`);

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

  const { statusCode, body } = await sendRequest(
    method,
    pathUrl,
    payload,
    authHeader,
    targetBaseUrl,
  );
  lastBody = body;

  console.log(`\n${YELLOW}${BOLD}< RESPONSE${NC}`);
  console.log(`  ${BOLD}HTTP Status:${NC} ${statusCode}`);
  console.log(`  ${BOLD}Body:${NC}`);
  console.log(formatBody(body));

  let errorMsg = "";
  if (statusCode !== expectedStatus) {
    errorMsg = `Expected HTTP ${expectedStatus}, received ${statusCode}`;
  } else if (validatorFn && !validatorFn(body)) {
    errorMsg = `Assertion failed for filter: ${filterDesc}`;
  }

  console.log("");
  if (!errorMsg) {
    console.log(
      `  ${GREEN}${BOLD}  PASS${NC} (HTTP ${statusCode} matched expected ${expectedStatus})`,
    );
    testStatuses.push("PASS");
    testDetails.push(`HTTP ${statusCode}`);
    passed++;
  } else {
    console.log(`  ${RED}${BOLD}  FAIL${NC} (${errorMsg})`);
    testStatuses.push("FAIL");
    testDetails.push(errorMsg);
    failed++;
  }
  console.log("");
}

async function runSuite() {
  await init();
  dotenv.config({ path: envPath, override: true });

  isHttps = process.env.USE_HTTPS === "true";
  keyPath = path.resolve(
    rootDir,
    process.env.SSL_KEY_PATH || "secrets/localhost-key.pem",
  );
  certPath = path.resolve(
    rootDir,
    process.env.SSL_CERT_PATH || "secrets/localhost-cert.pem",
  );

  app = require("../src/app");

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

    httpServer = http.createServer(app);
    await new Promise((resolve) => httpServer.listen(0, resolve));
    httpBaseUrl = `http://localhost:${httpServer.address().port}`;
  } else {
    server = http.createServer(app);
  }

  const port = parseInt(process.env.PORT, 10) || 3000;
  await new Promise((resolve) => server.listen(port, resolve));
  baseUrl = `${isHttps ? "https" : "http"}://localhost:${port}`;
  if (!isHttps) {
    httpBaseUrl = baseUrl;
  }

  console.log(`${BOLD}Starting integration test runner${NC}`);
  console.log(
    `Server ready at ${baseUrl} ${GREEN}[READY]${NC} (PID: ${process.pid})\n`,
  );
  console.log(`${BOLD}--- Starting Integration Test Suite ---${NC}\n`);

  // Test 1: Register - Invalid Email
  await assertRequest(
    "Reject registration with invalid email (Register - Invalid Email)",
    400,
    "POST",
    "/api/auth/register",
    { email: "not-an-email", password: testPassword, role: "freelancer" },
    "",
    (b) =>
      b?.error?.code === "VALIDATION_ERROR" &&
      b?.error?.details?.some((d) => d.field === "email"),
    '.error.code == "VALIDATION_ERROR" and email error exists',
  );

  // Test 2: Register - Weak Password
  await assertRequest(
    "Reject registration with weak password (Register - Weak Password)",
    400,
    "POST",
    "/api/auth/register",
    { email: testEmail, password: "123", role: "freelancer" },
    "",
    (b) =>
      b?.error?.code === "VALIDATION_ERROR" &&
      b?.error?.details?.some((d) => d.field === "password"),
    '.error.code == "VALIDATION_ERROR" and password error exists',
  );

  // Test 3: Register - Missing Email
  await assertRequest(
    "Reject registration with missing email (Register - Missing Email)",
    400,
    "POST",
    "/api/auth/register",
    { password: testPassword, role: "freelancer" },
    "",
    (b) =>
      b?.error?.code === "VALIDATION_ERROR" &&
      b?.error?.details?.some(
        (d) => d.field === "email" && d.message === "Email is required",
      ),
    '.error.code == "VALIDATION_ERROR" and email required message exists',
  );

  // Test 4: Register - Unknown Field
  await assertRequest(
    "Reject registration with unknown field (Register - Unknown Field)",
    400,
    "POST",
    "/api/auth/register",
    {
      email: testEmail,
      password: testPassword,
      role: "freelancer",
      username: "not-allowed",
    },
    "",
    (b) =>
      b?.error?.code === "UNKNOWN_FIELDS" &&
      b?.error?.details?.some((d) => d.field === "username"),
    '.error.code == "UNKNOWN_FIELDS" and username rejected',
  );

  // Test 5: Register - Successful Registration
  const registerPayload = {
    email: testEmail,
    password: testPassword,
    role: "freelancer",
  };
  await assertRequest(
    "Register new user account (Valid Register / Register - Successful Registration)",
    201,
    "POST",
    "/api/auth/register",
    registerPayload,
    "",
    (b) =>
      b?.user?.email === testEmail &&
      b?.user?.role === "freelancer" &&
      b?.message === "User successfully registered." &&
      !b?.user?.passwordHash,
    `.user.email == "${testEmail}" and passwordHash is undefined`,
  );

  // Test 6: Valid Register No HTTPS
  await assertRequest(
    "Register user account over HTTP (Valid Register No HTTPS)",
    201,
    "POST",
    "/api/auth/register",
    {
      email: httpTestEmail,
      password: testPassword,
      role: "freelancer",
    },
    "",
    (b) =>
      b?.user?.email === httpTestEmail &&
      b?.message === "User successfully registered.",
    `.user.email == "${httpTestEmail}" over HTTP transport`,
    httpBaseUrl,
  );

  // Test 7: Register - Duplicate Email
  await assertRequest(
    "Reject duplicate account registration (Register - Duplicate Email)",
    409,
    "POST",
    "/api/auth/register",
    registerPayload,
    "",
    (b) => b?.error?.code === "DUPLICATE_EMAIL",
    '.error.code == "DUPLICATE_EMAIL"',
  );

  // Test 8: Login - Invalid Email
  await assertRequest(
    "Reject login with invalid email syntax (Login Invalid Email)",
    400,
    "POST",
    "/api/auth/login",
    { email: "not-an-email", password: testPassword },
    "",
    (b) =>
      b?.error?.code === "VALIDATION_ERROR" &&
      b?.error?.details?.some((d) => d.field === "email"),
    '.error.code == "VALIDATION_ERROR" and email error exists',
  );

  // Test 9: Login - Missing Password
  await assertRequest(
    "Reject login with missing password (Login No Password)",
    400,
    "POST",
    "/api/auth/login",
    { email: testEmail },
    "",
    (b) =>
      b?.error?.code === "VALIDATION_ERROR" &&
      b?.error?.details?.some((d) => d.field === "password"),
    '.error.code == "VALIDATION_ERROR" and password error exists',
  );

  // Test 10: Login - Invalid Password
  await assertRequest(
    "Reject login with password exceeding length limit (Login Invalid Password)",
    400,
    "POST",
    "/api/auth/login",
    { email: testEmail, password: "A".repeat(129) },
    "",
    (b) =>
      b?.error?.code === "VALIDATION_ERROR" &&
      b?.error?.details?.some((d) => d.field === "password"),
    '.error.code == "VALIDATION_ERROR" and password error exists',
  );

  // Test 11: Login - Invalid Credentials
  await assertRequest(
    "Reject login with invalid credentials (Login - Invalid Credentials)",
    401,
    "POST",
    "/api/auth/login",
    { email: testEmail, password: "WrongPassword123!" },
    "",
    (b) => b?.error?.code === "INVALID_CREDENTIALS",
    '.error.code == "INVALID_CREDENTIALS"',
  );

  // Test 12: Login - Valid
  const loginPayload = {
    email: testEmail,
    password: testPassword,
  };
  await assertRequest(
    "Authenticate user and issue JWT (Valid Login / Login - Valid)",
    200,
    "POST",
    "/api/auth/login",
    loginPayload,
    "",
    (b) =>
      Boolean(b?.token) &&
      b?.user?.email === testEmail &&
      !b?.user?.passwordHash,
    `.token != null and .user.email == "${testEmail}"`,
  );

  authToken = lastBody?.token || "";
  if (!authToken) {
    console.log(
      `${RED}${BOLD}Aborting remaining tests: Failed to retrieve JWT token from login response.${NC}\n`,
    );
    await cleanupAndExit(1);
  }

  // Test 13: GET /me - No Token
  await assertRequest(
    "Deny access to /me without token (GET /me - No Token)",
    401,
    "GET",
    "/api/auth/me",
    null,
    "",
    (b) => b?.error?.code === "UNAUTHORIZED",
    '.error.code == "UNAUTHORIZED"',
  );

  // Test 14: GET /me - Invalid Token
  await assertRequest(
    "Deny access to /me with malformed token (GET /me - Invalid Token)",
    401,
    "GET",
    "/api/auth/me",
    null,
    "Bearer malformed.or.invalid.token",
    (b) => b?.error?.code === "INVALID_TOKEN",
    '.error.code == "INVALID_TOKEN"',
  );

  // Test 15: GET /me - Valid Token
  await assertRequest(
    "Allow access to /me with valid Bearer token (GET /me - Valid Token)",
    200,
    "GET",
    "/api/auth/me",
    null,
    `Bearer ${authToken}`,
    (b) =>
      Boolean(b?.user) &&
      b?.user?.email === testEmail &&
      !b?.user?.passwordHash,
    `.user.email == "${testEmail}" and passwordHash is undefined`,
  );

  // Postman / Newman Test Suite
  console.log(`${BOLD}${BLUE}${DOUBLE_DIVIDER}${NC}`);
  console.log(
    `${BOLD}             RUNNING POSTMAN COLLECTION (NEWMAN)            ${NC}`,
  );
  console.log(`${BOLD}${BLUE}${DOUBLE_DIVIDER}${NC}\n`);

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(
        "npx",
        [
          "newman",
          "run",
          "tests/postman/HustleHub-Auth.postman_collection.json",
          "-e",
          "tests/postman/HustleHub-Local.postman_environment.json",
          "--insecure",
        ],
        { stdio: "inherit", cwd: rootDir, shell: true },
      );

      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Newman exited with code ${code}`));
      });

      child.on("error", reject);
    });

    testTitles.push("Postman Collection (Newman)");
    testStatuses.push("PASS");
    testDetails.push("All Postman tests passed");
    passed++;
  } catch (err) {
    testTitles.push("Postman Collection (Newman)");
    testStatuses.push("FAIL");
    testDetails.push("Newman run failed");
    failed++;
  }
  console.log("");

  const total = passed + failed;
  console.log(`${BOLD}${BLUE}${DOUBLE_DIVIDER}${NC}`);
  console.log(
    `${BOLD}                       TEST SUMMARY                         ${NC}`,
  );
  console.log(`${BOLD}${BLUE}${DOUBLE_DIVIDER}${NC}`);
  for (let i = 0; i < testTitles.length; i++) {
    if (testStatuses[i] === "PASS") {
      console.log(
        `  ${GREEN}${BOLD}${"  PASS".padEnd(6)}${NC}  ${testTitles[i]}`,
      );
    } else {
      console.log(
        `  ${RED}${BOLD}${"  FAIL".padEnd(6)}${NC}  ${testTitles[i]} ${RED}(${testDetails[i]})${NC}`,
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

async function cleanupAndExit(code) {
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve)).catch(() => {});
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve)).catch(() => {});
  }
  process.exit(code);
}

runSuite().catch(async (err) => {
  console.error(`\n${RED}${BOLD}Unexpected Test Error:${NC}`, err);
  await cleanupAndExit(1);
});
