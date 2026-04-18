const express = require("express");
const { useAuth } = require("../middlewares/auth");
const connectionRequestModel = require("../models/connectionRequest");
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

userRouter.get("/user/search", useAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const query = req.query.q?.trim() || "";
    let limit = parseInt(req.query.limit) || 20;
    limit = Math.min(limit, 20);

    if (!query || query.length < 2) {
      return res.json({
        message: "Search query is too short",
        data: [],
      });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");

    const connectionRequests = await connectionRequestModel
      .find({
        $or: [{ fromUserId: loggedInUserId }, { toUserId: loggedInUserId }],
      })
      .select("fromUserId toUserId status");

    const relationshipStatusByUserId = new Map();
    const excludedUserIds = new Set([loggedInUserId.toString()]);
    connectionRequests.forEach((request) => {
      const isLoggedInUserSender =
        request.fromUserId.toString() === loggedInUserId.toString();
      const otherUserId = isLoggedInUserSender
        ? request.toUserId.toString()
        : request.fromUserId.toString();

      relationshipStatusByUserId.set(otherUserId, request.status);

      if (["ignored", "rejected"].includes(request.status)) {
        excludedUserIds.add(otherUserId);
      }
    });

    const users = await User.find({
      _id: { $nin: Array.from(excludedUserIds) },
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { skills: searchRegex },
      ],
    })
      .select(USER_SAFE_DATA)
      .limit(limit)
      .lean();

    const usersWithRelationshipStatus = users.map((user) => {
      const relationStatus =
        relationshipStatusByUserId.get(user._id.toString()) || "new";

      return {
        ...user,
        relationStatus,
        hasPendingRequest: relationStatus === "interested",
        isConnected: relationStatus === "accepted",
      };
    });

    res.json({
      message: "Search results fetched successfully",
      data: usersWithRelationshipStatus,
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

userRouter.get("/user/relationship/:targetUserId", useAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { targetUserId } = req.params;

    const existingRequest = await connectionRequestModel
      .findOne({
        $or: [
          { fromUserId: loggedInUserId, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: loggedInUserId },
        ],
      })
      .select("status");

    const relationStatus = existingRequest?.status || "new";

    res.json({
      message: "Relationship fetched successfully",
      data: {
        relationStatus,
        hasPendingRequest: relationStatus === "interested",
        isConnected: relationStatus === "accepted",
      },
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

userRouter.get("/user/:targetUserId", useAuth, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const targetUser = await User.findById(targetUserId);
    res.json({
      message: "user fetched successfully",
      data: targetUser,
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

module.exports = userRouter;
