const express = require("express");
const { useAuth } = require("../middlewares/auth");
const connectionRequestModel = require("../models/connectionRequest");
const { connection } = require("mongoose");
const User = require("../models/user");
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

userRouter.get("/user/connections", useAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const connections = await connectionRequestModel
      .find({
        $or: [
          { fromUserId: loggedInUserId, status: "accepted" },
          { toUserId: loggedInUserId, status: "accepted" },
        ],
      })
      .populate("fromUserId toUserId", USER_SAFE_DATA);

    const data = connections.map((connection) => {
      if (connection.fromUserId._id.toString() === loggedInUserId.toString()) {
        return connection.toUserId;
      }
      return connection.fromUserId;
    });

    res.json({
      message: "Connections fetched successfully",
      data: data,
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

userRouter.get("/feed", useAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit; // max limit is 50
    const skip = (page - 1) * limit;

    const loggedInUserId = req.user._id;
    const connectionRequests = await connectionRequestModel
      .find({
        $or: [{ fromUserId: loggedInUserId }, { toUserId: loggedInUserId }],
      })
      .select("fromUserId toUserId");

    const excludedUserIds = new Set();
    connectionRequests.forEach((request) => {
      excludedUserIds.add(request.fromUserId.toString());
      excludedUserIds.add(request.toUserId.toString());
    });
    excludedUserIds.add(loggedInUserId.toString());
    const users = await User.find({
      _id: { $nin: Array.from(excludedUserIds) },
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);
    res.json({
      message: "Feed fetched successfully",
      data: users,
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

module.exports = userRouter;
