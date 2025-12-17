const express = require("express");
const { Chat } = require("../models/chat");
const { useAuth } = require("../middlewares/auth");
const chatRouter = express.Router();

chatRouter.get("/chat/:toUserId", useAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { toUserId } = req.params;
    let chat = await Chat.findOne({
      participants: {
        $all: [
          { $elemMatch: { participantId: loggedInUserId } },
          { $elemMatch: { participantId: toUserId } },
        ],
      },
    }).populate([
      { path: "messages.senderId", select: "firstName lastName" },
      { path: "participants.participantId", select: "firstName lastName" },
    ]);

    if (!chat) {
      chat = new Chat({
        participants: [
          { participantId: loggedInUserId },
          { participantId: toUserId },
        ],
        messages: [],
      });
      await chat.save();
    }

    res.json(chat);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

chatRouter.post("/chat/:chatId/markSeen", useAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { chatId } = req.params;
    const { messageId } = req.body;

    const updatedChat = await Chat.findOneAndUpdate(
      {
        _id: chatId,
        "messages._id": messageId,
      },
      {
        $addToSet: { "messages.$.seenBy": loggedInUserId },
      },
      { new: true }
    );

    if (!updatedChat) {
      return res.status(404).json({ error: "Chat or message not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

module.exports = chatRouter;
