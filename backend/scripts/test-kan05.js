const https = require("https");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const config = require("../src/config");

const User = require("../src/models/user");
const Gig = require("../src/models/gig");
const Booking = require("../src/models/booking");
const Transaction = require("../src/models/transaction");

const BASE_URL = "https://localhost:3000";
const TEST_PREFIX = `kan05-${Date.now()}`;

let testClient;
let freelancerA;
let freelancerB;
let gigA;
let gigB;
let bookingA;
let transactionA;

let passCount = 0;
let failCount = 0;

function pass(message) {
    passCount++;
    console.log(`PASS | ${message}`);
}

function fail(message, detail = "") {
    failCount++;
    console.log(`FAIL | ${message}${detail ? ` | ${detail}` : ""}`);
}

function createToken(user) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
        },
        config.jwt.secret,
        {
            expiresIn: "1h",
        }
    );
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
        title: `${TEST_PREFIX} Gig A`,
        category: "Development",
        description: "KAN-05 test gig A.",
        rate: 500,
        durationHours: 5,
        status: "Active",
    });

    gigB = await Gig.create({
        freelancer: freelancerB._id,
        title: `${TEST_PREFIX} Gig B`,
        category: "Development",
        description: "KAN-05 test gig B.",
        rate: 750,
        durationHours: 5,
        status: "Active",
    });

    /*
     * Create a booking/transaction for Freelancer A.
     *
     * This mirrors the application's booking behaviour and
     * gives us known data to test the freelancer endpoints.
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
                notes: "KAN-05 automated test booking",
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
     * ---------------------------------------------------------
     * Authentication
     * ---------------------------------------------------------
     */

    let response = await liveRequest(
        "GET",
        "/api/bookings/mine"
    );

    if (response.statusCode === 401) {
        pass("Unauthenticated access to freelancer bookings is rejected");
    } else {
        fail(
            "Unauthenticated access to freelancer bookings is rejected",
            `Expected 401, received ${response.statusCode}`
        );
    }

    response = await liveRequest(
        "GET",
        "/api/transactions/income"
    );

    if (response.statusCode === 401) {
        pass("Unauthenticated access to freelancer income is rejected");
    } else {
        fail(
            "Unauthenticated access to freelancer income is rejected",
            `Expected 401, received ${response.statusCode}`
        );
    }

    /*
     * ---------------------------------------------------------
     * RBAC
     * ---------------------------------------------------------
     */

    response = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(testClient)}`,
            },
        }
    );

    if (response.statusCode === 403) {
        pass("Client cannot access freelancer bookings");
    } else {
        fail(
            "Client cannot access freelancer bookings",
            `Expected 403, received ${response.statusCode}`
        );
    }

    response = await liveRequest(
        "GET",
        "/api/transactions/income",
        {
            headers: {
                Authorization: `Bearer ${createToken(testClient)}`,
            },
        }
    );

    if (response.statusCode === 403) {
        pass("Client cannot access freelancer income");
    } else {
        fail(
            "Client cannot access freelancer income",
            `Expected 403, received ${response.statusCode}`
        );
    }

    /*
     * ---------------------------------------------------------
     * Freelancer A bookings
     * ---------------------------------------------------------
     */

    response = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerA)}`,
            },
        }
    );

    if (response.statusCode === 200) {
        pass("Freelancer can retrieve their bookings");
    } else {
        fail(
            "Freelancer can retrieve their bookings",
            `Expected 200, received ${response.statusCode}`
        );
    }

    const returnedBookingIds =
        response.body?.bookings?.map((booking) =>
            booking._id?.toString()
        ) || [];

    if (returnedBookingIds.includes(bookingA._id.toString())) {
        pass("Freelancer receives their own booking");
    } else {
        fail("Freelancer receives their own booking");
    }

    /*
     * ---------------------------------------------------------
     * Freelancer B isolation
     * ---------------------------------------------------------
     */

    response = await liveRequest(
        "GET",
        "/api/bookings/mine",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerB)}`,
            },
        }
    );

    if (response.statusCode === 200) {
        pass("Second freelancer can access their own booking endpoint");
    } else {
        fail(
            "Second freelancer can access their own booking endpoint",
            `Expected 200, received ${response.statusCode}`
        );
    }

    const freelancerBBookingIds =
        response.body?.bookings?.map((booking) =>
            booking._id?.toString()
        ) || [];

    if (!freelancerBBookingIds.includes(bookingA._id.toString())) {
        pass("Freelancer cannot see another freelancer's booking");
    } else {
        fail("Freelancer cannot see another freelancer's booking");
    }

    /*
     * ---------------------------------------------------------
     * Income
     * ---------------------------------------------------------
     */

    response = await liveRequest(
        "GET",
        "/api/transactions/income",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerA)}`,
            },
        }
    );

    if (response.statusCode === 200) {
        pass("Freelancer can retrieve their income");
    } else {
        fail(
            "Freelancer can retrieve their income",
            `Expected 200, received ${response.statusCode}`
        );
    }

    const transactionIds =
        response.body?.transactions?.map((transaction) =>
            transaction._id?.toString()
        ) || [];

    if (transactionIds.includes(transactionA._id.toString())) {
        pass("Freelancer receives their own transaction");
    } else {
        fail("Freelancer receives their own transaction");
    }

    /*
     * The transaction starts as Pending.
     */
    if (response.body?.totalIncome === 0) {
        pass("Pending transaction is excluded from total income");
    } else {
        fail(
            "Pending transaction is excluded from total income",
            `Expected 0, received ${response.body?.totalIncome}`
        );
    }

    /*
     * Complete the transaction and verify the income calculation.
     */
    transactionA.status = "Completed";
    await transactionA.save();

    response = await liveRequest(
        "GET",
        "/api/transactions/income",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerA)}`,
            },
        }
    );

    if (response.body?.totalIncome === 500) {
        pass("Completed transaction amount is included in total income");
    } else {
        fail(
            "Completed transaction amount is included in total income",
            `Expected 500, received ${response.body?.totalIncome}`
        );
    }

    /*
     * Freelancer B must not see Freelancer A's transaction.
     */
    response = await liveRequest(
        "GET",
        "/api/transactions/income",
        {
            headers: {
                Authorization: `Bearer ${createToken(freelancerB)}`,
            },
        }
    );

    if (response.statusCode === 200) {
        pass("Second freelancer can access their own income endpoint");
    } else {
        fail(
            "Second freelancer can access their own income endpoint",
            `Expected 200, received ${response.statusCode}`
        );
    }

    const freelancerBTransactionIds =
        response.body?.transactions?.map((transaction) =>
            transaction._id?.toString()
        ) || [];

    if (!freelancerBTransactionIds.includes(transactionA._id.toString())) {
        pass("Freelancer cannot see another freelancer's transaction");
    } else {
        fail("Freelancer cannot see another freelancer's transaction");
    }

    /*
     * ---------------------------------------------------------
     * Summary
     * ---------------------------------------------------------
     */

    console.log("\n=== KAN-05 TEST SUMMARY ===");
    console.log(`PASS: ${passCount}`);
    console.log(`FAIL: ${failCount}`);

    if (failCount > 0) {
        throw new Error("KAN-05 automated tests failed");
    }

    console.log("KAN-05 automated tests passed.");
}

async function cleanup() {
    if (transactionA) {
        await Transaction.deleteOne({ _id: transactionA._id });
    }

    if (bookingA) {
        await Booking.deleteOne({ _id: bookingA._id });
    }

    if (gigA) {
        await Gig.deleteOne({ _id: gigA._id });
    }

    if (gigB) {
        await Gig.deleteOne({ _id: gigB._id });
    }

    if (testClient) {
        await User.deleteOne({ _id: testClient._id });
    }

    if (freelancerA) {
        await User.deleteOne({ _id: freelancerA._id });
    }

    if (freelancerB) {
        await User.deleteOne({ _id: freelancerB._id });
    }

    console.log("[+] Test data cleaned up");

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
            console.error(`Cleanup failed: ${cleanupError.message}`);
            process.exitCode = 1;
        }
    }
})();