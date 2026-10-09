const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    booking: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    client: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    freelancer: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Refunded'],
        default: 'Pending'
    }
}, {timestamps: true});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;