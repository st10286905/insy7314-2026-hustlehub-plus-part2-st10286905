const User = require("../models/user");
const Gig = require("../models/gig");

exports.create = async (req, res, next) => {
  try {
    const { title, category, description, rate, durationHours } = req.body;
    const userID = req.user.id;

    const existingFreelancer = await User.findById(userID).exec();
    if (existingFreelancer == null)
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Freelancer does not exist.",
        },
      });

    const gig = await Gig.create({
        freelancer: userID,
        title: title, 
        category: category,
        description: description,
        rate: rate,
        durationHours: durationHours
    });

    return res.status(201).json({
      message: "Gig successfully created.",
      gig: {
        id: gig.id,
        title: gig.title,
        description: gig.description,
        rate: gig.rate,
        duractionHours: gig.durationHours,
        status: gig.status,
        category: gig.category,
        createdAt: gig.createdAt
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.mine = async (req, res, next) => {
  try {
    const userID = req.user.id;
    const gigs = await Gig.find({ freelancer: userID });

    return res.status(200).json({ gigs });
  } catch (err) {
    next(err);
  }
};

exports.getGigByID = async (req, res, next) => {
  try {
    const gigID = req.params.id;

    const gig = await Gig.findOne()
    .where("_id").equals(gigID).exec();

    return res.status(200).json(gig);
  } catch (err) {
    next(err);
  }
};

exports.updateGigByID = async (req, res, next) => {
    try {
    const gigID = req.params.id;
    const {title, category, description, rate, durationHours, status} = req.body;
    const filter = { _id: gigID };

    const gig = await Gig.findOneAndUpdate(
      filter,
      { $set: { title, category, description, rate, durationHours, status } },
      { new: true, runValidators: true }
    );

    return res.status(200).json(gig);
  } catch (err) {
    next(err);
  }
}

exports.deleteGigByID = async (req, res, next) => {
    try {
    const gigID = req.params.id;
    const filter = { _id: gigID };

    await Gig.findOneAndDelete(filter);

    return res.status(200).json({ message: "Gig successfully deleted." });
  } catch (err) {
    next(err);
  }
}

exports.getGigs = async (req, res, next) => {
  try {

    const { search, category, minRate, maxRate, page, limit } = req.query;

    const filter = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escaped, $options: 'i' };
    }
    if (category) filter.category = category;
    if (minRate !== undefined || maxRate !== undefined) {
      filter.rate = {};
      if (minRate !== undefined) filter.rate.$gte = minRate;
      if (maxRate !== undefined) filter.rate.$lte = maxRate;
    }

    const gigs = await Gig.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json(gigs);
  } catch (err) {
    next(err);
  }
}