require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../src/models/user");
const Gig = require("../src/models/gig");
const Booking = require("../src/models/booking");
const Transaction = require("../src/models/transaction");
const bookingController = require("../src/controllers/booking.controller");

const TEST_PREFIX = `kan04-${Date.now()}`;

let testClient;
let testFreelancer;
let testGig;
let testBooking;
let testTransaction;

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`FAIL: ${message}`);
    }

    console.log(`PASS: ${message}`);
};

const createMockResponse = () => {
    const response = {
        statusCode: null,
        body: null,
    };

    response.status = (code) => {
        response.statusCode = code;
        return response;
    };

    response.json = (body) => {
        response.body = body;
        return response;
    };

    return response;
};

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("[+] Connected to MongoDB");

    testClient = await User.create({
        name: `${TEST_PREFIX}-client`,
        email: `${TEST_PREFIX}-client@example.com`,
        password: "TestPassword123!",
        role: "client",
    });

    testFreelancer = await User.create({
        name: `${TEST_PREFIX}-freelancer`,
        email: `${TEST_PREFIX}-freelancer@example.com`,
        password: "TestPassword123!",
        role: "freelancer",
    });

    testGig = await Gig.create({
        freelancer: testFreelancer._id,
        title: `${TEST_PREFIX} test gig`,
        category: "Development",
        description: "Temporary gig for KAN-04 transaction testing.",
        rate: 1500,
        durationHours: 5,
        status: "Active",
    });

    console.log(`[+] Created test gig at rate R${testGig.rate}`);

    const req = {
        body: {
            gig: testGig._id.toString(),
            notes: "KAN-04 transaction test",
        },
        user: {
            id: testClient._id,
            role: "client",
        },
    };

    const res = createMockResponse();

    await bookingController.create(req, res, (error) => {
        throw error;
    });

    assert(
        res.statusCode === 201,
        "Booking creation returns HTTP 201"
    );

    assert(
        res.body && res.body.booking,
        "Booking is returned in the response"
    );

    testBooking = await Booking.findById(res.body.booking._id);

    assert(
        testBooking,
        "Booking was persisted to MongoDB"
    );

    testTransaction = await Transaction.findOne({
        booking: testBooking._id,
    });

    assert(
        testTransaction,
        "Transaction was created for the booking"
    );

    assert(
        testTransaction.booking.equals(testBooking._id),
        "Transaction references the created booking"
    );

    assert(
        testTransaction.client.equals(testBooking.client),
        "Transaction client matches the booking client"
    );

    assert(
        testTransaction.freelancer.equals(testBooking.freelancer),
        "Transaction freelancer matches the booking freelancer"
    );

    assert(
        testTransaction.amount === testGig.rate,
        "Transaction amount matches the gig rate"
    );

    assert(
        testTransaction.status === "Pending",
        "Transaction status is Pending"
    );

    console.log("\nKAN-04 transaction test passed.");
};

const cleanup = async () => {
    if (testTransaction) {
        await Transaction.deleteOne({ _id: testTransaction._id });
    }

    if (testBooking) {
        await Booking.deleteOne({ _id: testBooking._id });
    }

    if (testGig) {
        await Gig.deleteOne({ _id: testGig._id });
    }

    if (testClient) {
        await User.deleteOne({ _id: testClient._id });
    }

    if (testFreelancer) {
        await User.deleteOne({ _id: testFreelancer._id });
    }

    console.log("[+] Test data cleaned up");

    await mongoose.disconnect();
};

(async () => {
    try {
        await run();
    } catch (error) {
        console.error(`\n${error.message}`);
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