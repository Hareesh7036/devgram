const express = require("express");
const { Chat } = require("../models/chat");
const { useAuth } = require("../middlewares/auth");
const chatRouter = express.Router();

chatRouter.get("/chat/:toUserId", useAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { toUserId } = req.params;
    const chat = await Chat.findOne({
      participants: { $all: [loggedInUserId, toUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });
    if (!chat) {
      chat = new Chat({
        participants: [loggedInUserId, toUserId],
        messages: [],
      });
      await chat.save();
    }

    res.json(chat);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

module.exports = chatRouter;
