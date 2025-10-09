const express = require("express");
const { useAuth } = require("../middlewares/auth");
const connectionRequestModel = require("../models/connectionRequest");
const userRouter = express.Router();

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";

userRouter.get("/user/requests/recieved", useAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const connectionRequests = await connectionRequestModel
      .find({ toUserId: loggedInUserId, status: "interested" })
      .populate("fromUserId", USER_SAFE_DATA);

    res.json({
      message: "Connection requests fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

module.exports = userRouter;
