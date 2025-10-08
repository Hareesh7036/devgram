const express = require("express");
const connectionRequestRouter = express.Router();
const User = require("../models/user");
const { useAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

connectionRequestRouter.post(
  "/request/send/:status/:toUserId",
  useAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const { status, toUserId } = req.params;

      const allowedStatuses = ["ignored", "interested"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).send("Invalid status for sending request");
      }

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingRequest) {
        return res
          .status(400)
          .send("A connection request already exists between these users");
      }

      const newConnectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      const data = await newConnectionRequest.save();

      res.json({
        message: `Connection request ${
          status === "interested" ? "sent successfully" : "ignored!!"
        }`,
        data,
      });
    } catch (err) {
      res.status(400).send("Error: " + err.message);
    }
  }
);

module.exports = connectionRequestRouter;
