const User = require("../models/user");
const Gig = require("../models/gig");
const Booking = require("../models/booking");
const Transaction = require("../models/transaction");

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const users = await User.find()
    .skip((page - 1) * limit)
    .limit(limit);

    return res.status(200).json({users});
  } catch (err) {
    next(err);
  }
};

exports.getGigs = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const gigs = await Gig.find()
    .skip((page - 1) * limit)
    .limit(limit);

    return res.status(200).json({gigs});
  } catch (err) {
    next(err);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const bookings = await Booking.find()
    .skip((page - 1) * limit)
    .limit(limit);

    return res.status(200).json({bookings});
  } catch (err) {
    next(err);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const transactions = await Transaction.find()
    .skip((page - 1) * limit)
    .limit(limit);

    return res.status(200).json({transactions});
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {

    const [users, gigs, bookings, transactions] = await Promise.all([
      User.countDocuments(),
      Gig.countDocuments(),
      Booking.countDocuments(),
      Transaction.countDocuments(),
    ]);

    return res.status(200).json({ users, gigs, bookings, transactions });
  } catch (err) {
    next(err);
  }
};



