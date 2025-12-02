const User = require("../models/user");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const useAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Unauthorized: No token provided");
    }
    const { userId } = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send("Unauthorized: User not found");
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).send("Unauthorized!!");
  }
};

module.exports = { useAuth };
