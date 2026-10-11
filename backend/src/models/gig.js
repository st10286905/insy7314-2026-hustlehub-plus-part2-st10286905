const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gigSchema = new Schema({
    freelancer : {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Development', 'Design', 'Writing', 'Marketing', 'Other'],
        required: true
    },
    description: {
        type: String,
        validate: [validateDescriptionLength, 'Description must be less than 2000 characters long'],
        required: true
    },
    rate: {
        type: Number,
        min: [1, 'Rate cannot be less than R1'],
        required: true
    },
    durationHours: {
        type: Number,
        min: [1, 'Duration cannot be less than 1hr'],
        max: [40, 'Duration cannot be more than 40hrs'],
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Paused']
    }
}, {timestamps: true});

function validateDescriptionLength(strLen){
    return strLen.length <= 2000;
}

const Gig = mongoose.model('Gig', gigSchema);
module.exports = Gig;