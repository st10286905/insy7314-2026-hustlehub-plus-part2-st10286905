const Gig = require("../models/gig");

const CheckGigOwnership = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Gig not found." } });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = gig.freelancer.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Gig not found." } });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { CheckGigOwnership };