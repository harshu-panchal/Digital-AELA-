import RecruiterProfile from "../models/RecruiterProfile.js";

export const getMyProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const profile = await RecruiterProfile.findOne({ user: userId }).populate("user", [
      "email",
      "fullName",
    ]);

    if (!profile) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Recruiter profile not found",
        },
      });
    }

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

export const upsertMyProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const payload = req.body;

    const profile = await RecruiterProfile.findOneAndUpdate(
      { user: userId },
      { ...payload, user: userId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("user", ["email", "fullName"]);

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

