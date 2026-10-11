const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Gig = require("../models/gig");
const Transaction = require("../models/transaction");

exports.create = async (req, res, next) => {
    try {
        /**
         * Validate the request body for creating a booking.
         * - gig: required, must be a valid MongoDB ObjectId.
         * - notes: optional, must be a string and not exceed 500 characters.
         */
        const { gig, notes } = req.body;
        if (!mongoose.Types.ObjectId.isValid(gig)) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Gig ID must be a valid MongoDB ObjectId",
                },
            });
        }
        /**
         * Check if the gig exists and is available for booking.
         * If the gig does not exist or is not available, return an appropriate error response.
         */
        const gigExists = await Gig.findById(gig).exec();
        if (!gigExists) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Gig not found",
                },
            });
        }

        if (gigExists.status !== "Active") {
            return res.status(400).json({
                error: {
                    code: "GIG_UNAVAILABLE",
                    message: "This gig is not available for booking. Please choose another gig.",
                },
            });
        }
        /**
         * Create a new booking with the provided gig ID, client ID (from the authenticated user), freelancer ID (from the gig), and optional notes.
         * The booking status is set to "Confirmed" upon creation.
         * If the booking is created successfully, return a 201 Created response with the booking details.
         */
        const booking = await Booking.create({
            gig: gigExists._id,
            client: req.user.id,
            freelancer: gigExists.freelancer,
            notes,
            status: "Confirmed",
        });

        /**
         * Create a Pending transaction for the booking.
         * The amount is derived from the gig rate, while the booking, client,
         * and freelancer IDs are derived from the created booking.
         */
        await Transaction.create({
            booking: booking._id,
            client: booking.client,
            freelancer: booking.freelancer,
            amount: gigExists.rate,
            status: "Pending",
        });

        res.status(201).json({
            message: "Booking created successfully",
            booking,
        });
    } catch (error) {
        next(error);
    }
}