const mongoose = require("mongoose");
const { validate } = require("./user");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    gig : {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    client : {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    freelancer : {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    notes: {
        type: String,
        validate: [validateNoteLength, 'Notes cannot exceed 500 characters in length']
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
        default: 'Pending'
    }
}, {timestamps: true});

function validateNoteLength(strLen){
    return strLen.length <= 500;
}

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;