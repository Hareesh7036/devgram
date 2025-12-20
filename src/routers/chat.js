const express = require("express");
const { Chat } = require("../models/chat");
const { useAuth } = require("../middlewares/auth");
const chatRouter = express.Router();

chatRouter.get("/chat/:toUserId", useAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { toUserId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    let chat = await Chat.findOne({
      participants: {
        $all: [
          { $elemMatch: { participantId: loggedInUserId } },
          { $elemMatch: { participantId: toUserId } },
        ],
      },
    })
      .select("_id participants messages") // need messages length
      .lean();

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

    const totalMessages = chat.messages.length;
    const start = Math.max(0, totalMessages - page * limit);
    const end = Math.min(limit, totalMessages - (page - 1) * limit);

    const chatWithMessages = await Chat.findById(chat._id, {
      // project only a window of messages
      messages: { $slice: [start, end] },
      participants: 1,
    }).populate([
      { path: "messages.senderId", select: "firstName lastName" },
      { path: "participants.participantId", select: "firstName lastName" },
    ]);

    res.json({
      chat: chatWithMessages,
      pagination: {
        totalMessages,
        page,
        limit,
        hasMore: start > 0,
      },
    });
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
