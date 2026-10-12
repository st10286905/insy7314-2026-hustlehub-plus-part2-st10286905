const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const beautifyUnique = require('mongoose-beautiful-unique-validation');

const emailRegex = /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const SALT_ROUNDS = 12;

const Schema = mongoose.Schema;
const userSchema = new Schema({
    name : {
        type: String,
        trim: true,
        required: true,
        validate: [lengthValidator, 'Name must be greater than 0 and less than 60 characters']
    },
    email : {
        type: String,
        lowercase: true,
        trim: true,
        required: [true, 'User email is required'],
        unique: true,
        match: [emailRegex, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String, 
        enum: ['freelancer', 'client', 'admin'],
        default: 'client',
        required: true
    },
}, {timestamps: true});

function lengthValidator(str){
    return (str.length <= 60) && (str.length > 0);
}

// Hash password before saving to MongoDB
userSchema.pre('save', async function (){
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Compare provided password with hashed password
userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.plugin(beautifyUnique);
const User = mongoose.model('User', userSchema);
module.exports = User;