const https = require("https");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const config = require("../src/config");

const User = require("../src/models/user");
const Gig = require("../src/models/gig");
const Booking = require("../src/models/booking");
const Transaction = require("../src/models/transaction");

const BASE_URL = "https://localhost:3000";
const TEST_PREFIX = `kan05-owasp-${Date.now()}`;

let testClient;
let freelancerA;
let freelancerB;
let gigA;
let bookingA;
let transactionA;

let passCount = 0;
let failCount = 0;

function pass(category, message, detail = "") {
    passCount++;
    console.log(
        `PASS | ${category} | ${message}${detail ? ` | ${detail}` : ""}`
    );
}

function fail(category, message, detail = "") {
    failCount++;
    console.log(
        `FAIL | ${category} | ${message}${detail ? ` | ${detail}` : ""}`
    );
}

function createToken(user, options = {}) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
        },
        options.secret || config.jwt.secret,
        {
            expiresIn: options.expiresIn || "1h",
        }
    );
}

function createTamperedToken(user) {
    const token = createToken(user);
    const parts = token.split(".");

    const signature = parts[2];
    const replacement = signature[0] === "a" ? "b" : "a";

    parts[2] = replacement + signature.slice(1);

    return parts.join(".");
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
                        parsed = data ? JSON.parse(data) : null;
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

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("[+] Connected to MongoDB");
    console.log(`[+] Test prefix: ${TEST_PREFIX}`);

    /*
     * ---------------------------------------------------------
     * Test data
     * ---------------------------------------------------------
     */

    testClient = await User.create({
        name: `${TEST_PREFIX}-client`,
        email: `${TEST_PREFIX}-client@example.com`,
        password: "TestPassword123!",
        role: "client",
    });

    freelancerA = await User.create({
        name: `${TEST_PREFIX}-freelancer-a`,
        email: `${TEST_PREFIX}-freelancer-a@example.com`,
        password: "TestPassword123!",
        role: "freelancer",
    });

    freelancerB = await User.create({
        name: `${TEST_PREFIX}-freelancer-b`,
        email: `${TEST_PREFIX}-freelancer-b@example.com`,
        password: "TestPassword123!",
        role: "freelancer",
    });

    gigA = await Gig.create({
        freelancer: freelancerA._id,
        title: `${TEST_PREFIX} Gig`,
        category: "Development",
        description: "Temporary KAN-05 OWASP test gig.",
        rate: 500,
        durationHours: 5,
        status: "Active",
    });

    /*
     * Create a real booking and transaction through the API.
     */
    const bookingResponse = await liveRequest(
        "POST",
        "/api/bookings",
        {
            headers: {
                Authorization: `Bearer ${createToken(testClient)}`,
            },
            body: {
                gig: gigA._id.toString(),
                notes: "KAN-05 OWASP test booking",
            },
        }
    );

    if (bookingResponse.statusCode !== 201) {
        throw new Error(
            `Unable to create test booking. HTTP ${bookingResponse.statusCode}`
        );
    }

    bookingA = await Booking.findOne({
        gig: gigA._id,
        client: testClient._id,
        freelancer: freelancerA._id,
    });

    transactionA = await Transaction.findOne({
        booking: bookingA._id,
    });

    /*
     * =========================================================
     * A01 - BROKEN ACCESS CONTROL
     * =========================================================
     */

    console.log("\n=== A01 - BROKEN ACCESS CONTROL ===");

    let result;

    result = await liveRequest(
        "GET",
        "/api/bookings/mine"
    );

    expectStatus(
        "A01",
        result,
        401,
        "Unauthenticated booking request is rejected"
    );

    result = await liveRequest(
        "GET",
        "/api/transactions/income"
    );

    expectStatus(
        "A01",
        result,
        401,
        "Unauthenticated income request is rejected"
    );

    result = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(testClient)}`,
            },
        }
    );

    expectStatus(
        "A01",
        result,
        403,
        "Client cannot access freelancer bookings"
    );

    result = await liveRequest(
        "GET",
        "/api/transactions/income",
        {
            headers: {
                Authorization: `Bearer ${createToken(testClient)}`,
            },
        }
    );

    expectStatus(
        "A01",
        result,
        403,
        "Client cannot access freelancer income"
    );

    result = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerA)}`,
            },
        }
    );

    expectStatus(
        "A01",
        result,
        200,
        "Freelancer can access their bookings"
    );

    const bookingIds =
        result.body?.bookings?.map((booking) =>
            booking._id?.toString()
        ) || [];

    if (bookingIds.includes(bookingA._id.toString())) {
        pass(
            "A01",
            "Freelancer can access their own booking"
        );
    } else {
        fail(
            "A01",
            "Freelancer can access their own booking"
        );
    }

    result = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerB)}`,
            },
        }
    );

    expectStatus(
        "A01",
        result,
        200,
        "Second freelancer can access their own bookings"
    );

    const freelancerBBookingIds =
        result.body?.bookings?.map((booking) =>
            booking._id?.toString()
        ) || [];

    if (!freelancerBBookingIds.includes(bookingA._id.toString())) {
        pass(
            "A01",
            "Freelancer B cannot access Freelancer A's booking"
        );
    } else {
        fail(
            "A01",
            "Freelancer B cannot access Freelancer A's booking"
        );
    }

    result = await liveRequest(
        "GET",
        "/api/transactions/income",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerA)}`,
            },
        }
    );

    expectStatus(
        "A01",
        result,
        200,
        "Freelancer can access their income"
    );

    const transactionIds =
        result.body?.transactions?.map((transaction) =>
            transaction._id?.toString()
        ) || [];

    if (transactionIds.includes(transactionA._id.toString())) {
        pass(
            "A01",
            "Freelancer can access their own transaction"
        );
    } else {
        fail(
            "A01",
            "Freelancer can access their own transaction"
        );
    }

    result = await liveRequest(
        "GET",
        "/api/transactions/income",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerB)}`,
            },
        }
    );

    expectStatus(
        "A01",
        result,
        200,
        "Second freelancer can access their own income"
    );

    const freelancerBTransactionIds =
        result.body?.transactions?.map((transaction) =>
            transaction._id?.toString()
        ) || [];

    if (!freelancerBTransactionIds.includes(transactionA._id.toString())) {
        pass(
            "A01",
            "Freelancer B cannot access Freelancer A's transaction"
        );
    } else {
        fail(
            "A01",
            "Freelancer B cannot access Freelancer A's transaction"
        );
    }

    /*
     * =========================================================
     * A02 - CRYPTOGRAPHIC FAILURES
     * =========================================================
     */

    console.log("\n=== A02 - CRYPTOGRAPHIC FAILURES ===");

    result = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(
                    freelancerA,
                    {
                        secret: "incorrect-secret",
                    }
                )}`,
            },
        }
    );

    expectStatus(
        "A02",
        result,
        401,
        "JWT signed with incorrect secret is rejected"
    );

    /*
     * =========================================================
     * A07 - IDENTIFICATION AND AUTHENTICATION FAILURES
     * =========================================================
     */

    console.log(
        "\n=== A07 - IDENTIFICATION AND AUTHENTICATION FAILURES ==="
    );

    result = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createTamperedToken(
                    freelancerA
                )}`,
            },
        }
    );

    expectStatus(
        "A07",
        result,
        401,
        "Tampered JWT is rejected"
    );

    result = await liveRequest(
        "GET",
        "/api/transactions/income",
        {
            headers: {
                Authorization: "Bearer not-a-valid-jwt",
            },
        }
    );

    expectStatus(
        "A07",
        result,
        401,
        "Malformed JWT is rejected"
    );

    result = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(
                    freelancerA,
                    {
                        expiresIn: -1,
                    }
                )}`,
            },
        }
    );

    expectStatus(
        "A07",
        result,
        401,
        "Expired JWT is rejected"
    );

    /*
     * =========================================================
     * A05 - SECURITY MISCONFIGURATION / SECURITY HEADERS
     * =========================================================
     */

    console.log(
        "\n=== A05 - SECURITY MISCONFIGURATION ==="
    );

    result = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerA)}`,
            },
        }
    );

    const requiredHeaders = [
        "content-security-policy",
        "strict-transport-security",
        "x-content-type-options",
        "x-frame-options",
        "referrer-policy",
    ];

    for (const header of requiredHeaders) {
        if (result.headers[header]) {
            pass(
                "A05",
                `${header} security header is present`
            );
        } else {
            fail(
                "A05",
                `${header} security header is present`
            );
        }
    }

    /*
     * =========================================================
     * SUMMARY
     * =========================================================
     */

    console.log("\n=== KAN-05 OWASP TEST SUMMARY ===");
    console.log(`PASS: ${passCount}`);
    console.log(`FAIL: ${failCount}`);

    if (failCount > 0) {
        throw new Error("KAN-05 OWASP security tests failed");
    }

    console.log("KAN-05 OWASP security tests passed.");
}

async function cleanup() {
    if (transactionA) {
        await Transaction.deleteOne({
            _id: transactionA._id,
        });
    }

    if (bookingA) {
        await Booking.deleteOne({
            _id: bookingA._id,
        });
    }

    if (gigA) {
        await Gig.deleteOne({
            _id: gigA._id,
        });
    }

    if (testClient) {
        await User.deleteOne({
            _id: testClient._id,
        });
    }

    if (freelancerA) {
        await User.deleteOne({
            _id: freelancerA._id,
        });
    }

    if (freelancerB) {
        await User.deleteOne({
            _id: freelancerB._id,
        });
    }

    console.log("[+] OWASP test data cleaned up");

    await mongoose.disconnect();
}

(async () => {
    try {
        await run();
    } catch (error) {
        console.error(`\nERROR: ${error.message}`);
        process.exitCode = 1;
    } finally {
        try {
            await cleanup();
        } catch (cleanupError) {
            console.error(
                `Cleanup failed: ${cleanupError.message}`
            );
            process.exitCode = 1;
        }
    }
})();