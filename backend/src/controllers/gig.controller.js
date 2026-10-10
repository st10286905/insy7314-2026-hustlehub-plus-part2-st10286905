const User = require("../models/user");
const Gig = require("../models/gig");
const jwt = require("jsonwebtoken");
const config = require("../config");



exports.create = async (req, res, next) => {
  try {
    const { title, category, description, rate, durationHours } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Missing or malformed token." },
      });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, config.jwt.secret);
    const userID = decodedToken.sub;

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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Missing or malformed token." },
      });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, config.jwt.secret);
    const userID = decodedToken.sub;

    const gigs = await Gig.find({ freelancer: userID });

    return res.status(200).json({ gigs });
  } catch (err) {
    next(err);
  }
};

exports.getGigByID = async (req, res, next) => {
  try {
    const gigID = req.params.id;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Missing or malformed token." },
      });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, config.jwt.secret);
    const userRole = decodedToken.role;

    const query = Gig.findOne()
    .where("_id").equals(gigID)
    .where("status").equals("Active");

    if(userRole === "freelancer"){
      const userID = decodedToken.sub;
      query.where("freelancer").equals(userID);
    }

    const gig = await query.exec();

    if(!gig){
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Gig not found." },
      });
    }

    return res.status(200).json(gig);
  } catch (err) {
    next(err);
  }
};
