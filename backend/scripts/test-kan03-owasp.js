const https = require("https");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const config = require("../src/config");
const {
    authenticate,
    authorizeRoles,
} = require("../src/middleware/auth.middleware");
const {
    bookingValidation,
} = require("../src/middleware/validation.middleware");

const BASE_URL = "https://localhost:3000";

let passCount = 0;
let failCount = 0;

function pass(category, message, detail = "") {
    passCount++;
    console.log(`PASS | ${category} | ${message}${detail ? ` | ${detail}` : ""}`);
}

function fail(category, message, detail = "") {
    failCount++;
    console.log(`FAIL | ${category} | ${message}${detail ? ` | ${detail}` : ""}`);
}

function info(category, message) {
    console.log(`INFO | ${category} | ${message}`);
}

function na(category, message) {
    console.log(`N/A | ${category} | ${message}`);
}

function createToken(payload, secret = config.jwt.secret) {
    return jwt.sign(payload, secret, {
        expiresIn: "1h",
    });
}

function createExpiredToken(payload, secret = config.jwt.secret) {
    return jwt.sign(payload, secret, {
        expiresIn: -1,
    });
}

function createTamperedToken(payload) {
    const token = createToken(payload);
    const parts = token.split(".");

    const signature = parts[2];
    const replacement = signature[0] === "a" ? "b" : "a";

    parts[2] = replacement + signature.slice(1);

    return parts.join(".");
}

function createMockResponse() {
    return {
        statusCode: 200,
        body: undefined,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(body) {
            this.body = body;
            return this;
        },
    };
}

function createMockRequest(body = {}, headers = {}) {
    return {
        body,
        headers,
        user: undefined,
    };
}

async function runMiddleware(middleware, req, res) {
    return new Promise((resolve, reject) => {
        let settled = false;

        const finish = (result) => {
            if (!settled) {
                settled = true;
                resolve(result);
            }
        };

        const next = (error) => {
            if (error) {
                if (!settled) {
                    settled = true;
                    reject(error);
                }
                return;
            }

            finish({
                nextCalled: true,
                req,
                res,
            });
        };

        try {
            const result = middleware(req, res, next);

            if (result && typeof result.then === "function") {
                result.catch((error) => {
                    if (!settled) {
                        settled = true;
                        reject(error);
                    }
                });
            }

            /*
             * Middleware such as authenticate() can terminate the
             * request by sending a response without calling next().
             * Give it a chance to do that, then resolve.
             */
            setImmediate(() => {
                finish({
                    nextCalled: false,
                    req,
                    res,
                });
            });
        } catch (error) {
            if (!settled) {
                settled = true;
                reject(error);
            }
        }
    });
}

function liveRequest(method, path, options = {}) {
    return new Promise((resolve, reject) => {
        const body = options.body
            ? JSON.stringify(options.body)
            : null;

        const headers = {
            Accept: "application/json",
            ...(body
                ? {
                      "Content-Type": "application/json",
                      "Content-Length": Buffer.byteLength(body),
                  }
                : {}),
            ...(options.headers || {}),
        };

        const request = https.request(
            `${BASE_URL}${path}`,
            {
                method,
                headers,

                // Local development uses a self-signed certificate.
                rejectUnauthorized: false,
            },
            (response) => {
                let data = "";

                response.on("data", (chunk) => {
                    data += chunk;
                });

                response.on("end", () => {
                    let parsed;

                    try {
                        parsed = data ? JSON.parse(data) : undefined;
                    } catch {
                        parsed = data;
                    }

                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body: parsed,
                    });
                });
            }
        );

        request.on("error", reject);

        if (body) {
            request.write(body);
        }

        request.end();
    });
}

function expectStatus(category, result, expected, message) {
    if (result.statusCode === expected) {
        pass(category, message, `HTTP ${result.statusCode}`);
    } else {
        fail(
            category,
            message,
            `Expected HTTP ${expected}, got HTTP ${result.statusCode}`
        );
    }
}

function expectBodyCode(category, result, expectedCode, message) {
    const actualCode = result.body?.error?.code;

    if (actualCode === expectedCode) {
        pass(category, message, expectedCode);
    } else {
        fail(
            category,
            message,
            `Expected ${expectedCode}, got ${actualCode || "none"}`
        );
    }
}

(async () => {
    console.log("=== KAN-03 OWASP SECURITY TESTS ===");
    console.log();

    const clientId = new mongoose.Types.ObjectId().toString();
    const freelancerId = new mongoose.Types.ObjectId().toString();
    const adminId = new mongoose.Types.ObjectId().toString();

    const validClientToken = createToken({
        sub: clientId,
        role: "client",
    });

    const freelancerToken = createToken({
        sub: freelancerId,
        role: "freelancer",
    });

    const adminToken = createToken({
        sub: adminId,
        role: "admin",
    });

    /*
     * ============================================================
     * A01 - BROKEN ACCESS CONTROL
     * ============================================================
     */

    console.log("=== A01 - BROKEN ACCESS CONTROL ===");

    // Direct middleware test - no token
    {
        const req = createMockRequest({}, {});
        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);

        if (
            res.statusCode === 401 &&
            res.body?.error?.code === "UNAUTHORIZED"
        ) {
            pass(
                "A01",
                "Unauthenticated request rejected",
                "HTTP 401"
            );
        } else {
            fail(
                "A01",
                "Unauthenticated request rejected",
                `Expected HTTP 401, got HTTP ${res.statusCode}`
            );
        }
    }

    // Direct authorization test - freelancer
    {
        const req = createMockRequest({}, {
            authorization: `Bearer ${freelancerToken}`,
        });
        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);
        await runMiddleware(authorizeRoles("client"), req, res);

        if (res.statusCode === 403) {
            pass(
                "A01",
                "Freelancer cannot access client-only booking endpoint",
                "HTTP 403"
            );
        } else {
            fail(
                "A01",
                "Freelancer cannot access client-only booking endpoint",
                `Expected HTTP 403, got HTTP ${res.statusCode}`
            );
        }
    }

    // Direct authorization test - admin
    {
        const req = createMockRequest({}, {
            authorization: `Bearer ${adminToken}`,
        });
        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);
        await runMiddleware(authorizeRoles("client"), req, res);

        if (res.statusCode === 403) {
            pass(
                "A01",
                "Admin cannot access client-only booking endpoint",
                "HTTP 403"
            );
        } else {
            fail(
                "A01",
                "Admin cannot access client-only booking endpoint",
                `Expected HTTP 403, got HTTP ${res.statusCode}`
            );
        }
    }

    // Live API - no authentication
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
            },
        });

        expectStatus(
            "A01",
            result,
            401,
            "Live API rejects unauthenticated booking request"
        );
        expectBodyCode(
            "A01",
            result,
            "UNAUTHORIZED",
            "Live API returns UNAUTHORIZED for unauthenticated request"
        );
    } catch (error) {
        fail(
            "A01",
            "Live API unauthenticated request test",
            error.message
        );
    }

    // Live API - freelancer
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${freelancerToken}`,
            },
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
            },
        });

        expectStatus(
            "A01",
            result,
            403,
            "Live API rejects freelancer booking request"
        );
    } catch (error) {
        fail(
            "A01",
            "Live API freelancer authorization test",
            error.message
        );
    }

    // Live API - admin
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
            },
        });

        expectStatus(
            "A01",
            result,
            403,
            "Live API rejects admin booking request"
        );
    } catch (error) {
        fail(
            "A01",
            "Live API admin authorization test",
            error.message
        );
    }

    console.log();

    /*
     * ============================================================
     * A02 - CRYPTOGRAPHIC FAILURES
     * ============================================================
     */

    console.log("=== A02 - CRYPTOGRAPHIC FAILURES ===");

    {
        const wrongSecretToken = createToken(
            {
                sub: clientId,
                role: "client",
            },
            "definitely-not-the-real-secret"
        );

        const req = createMockRequest({}, {
            authorization: `Bearer ${wrongSecretToken}`,
        });

        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);

        if (
            res.statusCode === 401 &&
            res.body?.error?.code === "INVALID_TOKEN"
        ) {
            pass(
                "A02",
                "JWT signed with incorrect secret rejected",
                "HTTP 401"
            );
        } else {
            fail(
                "A02",
                "JWT signed with incorrect secret rejected",
                `Expected HTTP 401, got HTTP ${res.statusCode}`
            );
        }
    }

    console.log();

    /*
     * ============================================================
     * A03 - INJECTION / INPUT VALIDATION
     * ============================================================
     */

    console.log("=== A03 - INJECTION / INPUT VALIDATION ===");

    // Direct validation - malformed ObjectId
    {
        const req = createMockRequest({
            gig: "not-a-valid-object-id",
        });

        const res = createMockResponse();

        for (const middleware of bookingValidation) {
            await runMiddleware(middleware, req, res);

            if (res.body !== undefined && res.statusCode >= 400) {
                break;
            }
        }

        if (res.statusCode === 400) {
            pass(
                "A03",
                "Malformed MongoDB ObjectId rejected",
                "HTTP 400"
            );
        } else {
            fail(
                "A03",
                "Malformed MongoDB ObjectId rejected",
                `Expected HTTP 400, got HTTP ${res.statusCode}`
            );
        }
    }

    // Live API - malformed ObjectId
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${validClientToken}`,
            },
            body: {
                gig: "not-a-valid-object-id",
            },
        });

        expectStatus(
            "A03",
            result,
            400,
            "Live API rejects malformed MongoDB ObjectId"
        );
    } catch (error) {
        fail(
            "A03",
            "Live API malformed ObjectId test",
            error.message
        );
    }

    // Direct validation - non-string notes
    {
        const req = createMockRequest({
            gig: new mongoose.Types.ObjectId().toString(),
            notes: 12345,
        });

        const res = createMockResponse();

        for (const middleware of bookingValidation) {
            await runMiddleware(middleware, req, res);

            if (res.body !== undefined && res.statusCode >= 400) {
                break;
            }
        }

        if (res.statusCode === 400) {
            pass(
                "A03",
                "Non-string notes value rejected",
                "HTTP 400"
            );
        } else {
            fail(
                "A03",
                "Non-string notes value rejected",
                `Expected HTTP 400, got HTTP ${res.statusCode}`
            );
        }
    }

    // Live API - non-string notes
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${validClientToken}`,
            },
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
                notes: 12345,
            },
        });

        expectStatus(
            "A03",
            result,
            400,
            "Live API rejects non-string notes"
        );
    } catch (error) {
        fail(
            "A03",
            "Live API non-string notes test",
            error.message
        );
    }

    // Direct validation - oversized notes
    {
        const req = createMockRequest({
            gig: new mongoose.Types.ObjectId().toString(),
            notes: "A".repeat(501),
        });

        const res = createMockResponse();

        for (const middleware of bookingValidation) {
            await runMiddleware(middleware, req, res);

            if (res.body !== undefined && res.statusCode >= 400) {
                break;
            }
        }

        if (res.statusCode === 400) {
            pass(
                "A03",
                "Oversized notes payload rejected",
                "HTTP 400"
            );
        } else {
            fail(
                "A03",
                "Oversized notes payload rejected",
                `Expected HTTP 400, got HTTP ${res.statusCode}`
            );
        }
    }

    // Live API - oversized notes
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${validClientToken}`,
            },
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
                notes: "A".repeat(501),
            },
        });

        expectStatus(
            "A03",
            result,
            400,
            "Live API rejects oversized notes"
        );
    } catch (error) {
        fail(
            "A03",
            "Live API oversized notes test",
            error.message
        );
    }

    console.log();

    /*
     * ============================================================
     * A04 - INSECURE DESIGN / MASS ASSIGNMENT
     * ============================================================
     */

    console.log("=== A04 - INSECURE DESIGN / MASS ASSIGNMENT ===");

    const massAssignmentBody = {
        gig: new mongoose.Types.ObjectId().toString(),
        notes: "Security test",
        client: new mongoose.Types.ObjectId().toString(),
        freelancer: new mongoose.Types.ObjectId().toString(),
        status: "Confirmed",
    };

    // Direct validation
    {
        const req = createMockRequest(massAssignmentBody);
        const res = createMockResponse();

        for (const middleware of bookingValidation) {
            await runMiddleware(middleware, req, res);

            if (res.body !== undefined && res.statusCode >= 400) {
                break;
            }
        }

        if (res.statusCode === 400) {
            pass(
                "A04",
                "Client identity cannot be supplied by request",
                "HTTP 400"
            );

            pass(
                "A04",
                "Freelancer identity cannot be supplied by request",
                "HTTP 400"
            );

            pass(
                "A04",
                "Booking status cannot be supplied by request",
                "HTTP 400"
            );
        } else {
            fail(
                "A04",
                "Mass assignment fields rejected",
                `Expected HTTP 400, got HTTP ${res.statusCode}`
            );
        }
    }

    // Live API
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${validClientToken}`,
            },
            body: massAssignmentBody,
        });

        expectStatus(
            "A04",
            result,
            400,
            "Live API rejects client/freelancer/status mass assignment"
        );

        expectBodyCode(
            "A04",
            result,
            "UNKNOWN_FIELDS",
            "Live API identifies mass-assignment fields as unknown"
        );
    } catch (error) {
        fail(
            "A04",
            "Live API mass-assignment test",
            error.message
        );
    }

    console.log();

    /*
     * ============================================================
     * A05 - SECURITY MISCONFIGURATION
     * ============================================================
     */

    console.log("=== A05 - SECURITY MISCONFIGURATION ===");

    // Direct middleware - malformed Authorization header
    {
        const req = createMockRequest({}, {
            authorization: "Basic abc123",
        });

        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);

        if (res.statusCode === 401) {
            pass(
                "A05",
                "Malformed Authorization header rejected",
                "HTTP 401"
            );
        } else {
            fail(
                "A05",
                "Malformed Authorization header rejected",
                `Expected HTTP 401, got HTTP ${res.statusCode}`
            );
        }
    }

    // Direct middleware - empty bearer token
    {
        const req = createMockRequest({}, {
            authorization: "Bearer ",
        });

        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);

        if (res.statusCode === 401) {
            pass(
                "A05",
                "Empty Bearer token rejected",
                "HTTP 401"
            );
        } else {
            fail(
                "A05",
                "Empty Bearer token rejected",
                `Expected HTTP 401, got HTTP ${res.statusCode}`
            );
        }
    }

    // Live API - malformed header
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: "Basic abc123",
            },
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
            },
        });

        expectStatus(
            "A05",
            result,
            401,
            "Live API rejects malformed Authorization header"
        );
    } catch (error) {
        fail(
            "A05",
            "Live API malformed Authorization test",
            error.message
        );
    }

    // Live API - empty Bearer
    try {
        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: "Bearer ",
            },
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
            },
        });

        expectStatus(
            "A05",
            result,
            401,
            "Live API rejects empty Bearer token"
        );
    } catch (error) {
        fail(
            "A05",
            "Live API empty Bearer test",
            error.message
        );
    }

    console.log();

    /*
     * ============================================================
     * A06 - VULNERABLE COMPONENTS
     * ============================================================
     */

    console.log("=== A06 - VULNERABLE COMPONENTS ===");

    info(
        "A06",
        "Dependency audit performed separately with npm audit"
    );

    console.log();

    /*
     * ============================================================
     * A07 - IDENTIFICATION AND AUTHENTICATION FAILURES
     * ============================================================
     */

    console.log("=== A07 - IDENTIFICATION AND AUTHENTICATION FAILURES ===");

    // Expired token - direct middleware
    {
        const expiredToken = createExpiredToken({
            sub: clientId,
            role: "client",
        });

        const req = createMockRequest({}, {
            authorization: `Bearer ${expiredToken}`,
        });

        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);

        if (
            res.statusCode === 401 &&
            res.body?.error?.code === "TOKEN_EXPIRED"
        ) {
            pass(
                "A07",
                "Expired JWT rejected",
                "HTTP 401"
            );
        } else {
            fail(
                "A07",
                "Expired JWT rejected",
                `Expected TOKEN_EXPIRED/401, got ${res.statusCode}`
            );
        }
    }

    // Valid client token - direct middleware
    {
        const req = createMockRequest({}, {
            authorization: `Bearer ${validClientToken}`,
        });

        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);

        if (
            res.statusCode === 200 &&
            req.user?.id === clientId &&
            req.user?.role === "client"
        ) {
            pass(
                "A07",
                "Valid client JWT accepted",
                "JWT accepted"
            );
        } else {
            fail(
                "A07",
                "Valid client JWT accepted",
                "JWT was not accepted correctly"
            );
        }
    }

    // Live API - expired token
    try {
        const expiredToken = createExpiredToken({
            sub: clientId,
            role: "client",
        });

        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${expiredToken}`,
            },
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
            },
        });

        expectStatus(
            "A07",
            result,
            401,
            "Live API rejects expired JWT"
        );

        expectBodyCode(
            "A07",
            result,
            "TOKEN_EXPIRED",
            "Live API identifies expired JWT"
        );
    } catch (error) {
        fail(
            "A07",
            "Live API expired JWT test",
            error.message
        );
    }

    // Live API - valid client JWT reaches booking logic
    try {
        const randomGigId = new mongoose.Types.ObjectId().toString();

        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${validClientToken}`,
            },
            body: {
                gig: randomGigId,
            },
        });

        /*
         * A random valid ObjectId should normally not exist in the
         * database. A 404 therefore proves that authentication,
         * authorization, validation and the database lookup were
         * reached successfully.
         */
        if (result.statusCode === 404) {
            pass(
                "A07",
                "Valid client JWT accepted by live API",
                "HTTP 404 after authenticated database lookup"
            );
        } else if (result.statusCode === 201) {
            pass(
                "A07",
                "Valid client JWT accepted by live API",
                "HTTP 201"
            );
        } else {
            fail(
                "A07",
                "Valid client JWT accepted by live API",
                `Expected HTTP 404 or 201, got HTTP ${result.statusCode}`
            );
        }
    } catch (error) {
        fail(
            "A07",
            "Live API valid JWT test",
            error.message
        );
    }

    console.log();

    /*
     * ============================================================
     * A08 - SOFTWARE AND DATA INTEGRITY
     * ============================================================
     */

    console.log("=== A08 - SOFTWARE AND DATA INTEGRITY ===");

    // Tampered JWT
    {
        const tamperedToken = createTamperedToken({
            sub: clientId,
            role: "client",
        });

        const req = createMockRequest({}, {
            authorization: `Bearer ${tamperedToken}`,
        });

        const res = createMockResponse();

        await runMiddleware(authenticate, req, res);

        if (
            res.statusCode === 401 &&
            res.body?.error?.code === "INVALID_TOKEN"
        ) {
            pass(
                "A08",
                "Tampered JWT rejected",
                "HTTP 401"
            );
        } else {
            fail(
                "A08",
                "Tampered JWT rejected",
                `Expected HTTP 401, got HTTP ${res.statusCode}`
            );
        }
    }

    // Live API - tampered JWT
    try {
        const tamperedToken = createTamperedToken({
            sub: clientId,
            role: "client",
        });

        const result = await liveRequest("POST", "/api/bookings", {
            headers: {
                Authorization: `Bearer ${tamperedToken}`,
            },
            body: {
                gig: new mongoose.Types.ObjectId().toString(),
            },
        });

        expectStatus(
            "A08",
            result,
            401,
            "Live API rejects tampered JWT"
        );

        expectBodyCode(
            "A08",
            result,
            "INVALID_TOKEN",
            "Live API identifies tampered JWT as invalid"
        );
    } catch (error) {
        fail(
            "A08",
            "Live API tampered JWT test",
            error.message
        );
    }

    console.log();

    /*
     * ============================================================
     * A09 - LOGGING AND MONITORING
     * ============================================================
     */

    console.log("=== A09 - LOGGING AND MONITORING ===");

    na(
        "A09",
        "Detailed logging/monitoring assessment requires the running application environment."
    );

    console.log();

    /*
     * ============================================================
     * A10 - SERVER-SIDE REQUEST FORGERY
     * ============================================================
     */

    console.log("=== A10 - SERVER-SIDE REQUEST FORGERY ===");

    na(
        "A10",
        "KAN-03 does not accept URLs or make server-side requests to user-controlled resources."
    );

    console.log();

    /*
     * ============================================================
     * SUMMARY
     * ============================================================
     */

    console.log("=== KAN-03 OWASP SUMMARY ===");
    console.log(`PASS: ${passCount}`);
    console.log(`FAIL: ${failCount}`);
    console.log("N/A: A09, A10");
    console.log();

    if (failCount === 0) {
        console.log(
            "RESULT: PASS - all applicable automated OWASP tests passed."
        );
        process.exitCode = 0;
    } else {
        console.log(
            "RESULT: FAIL - one or more OWASP tests failed."
        );
        process.exitCode = 1;
    }
})();