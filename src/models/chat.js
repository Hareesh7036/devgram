const mongoose = require("mongoose");

const messageIdSchema = {
  type: mongoose.Schema.Types.ObjectId,
  required: false,
};

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  messageId: messageIdSchema,
  seenBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
});

const chatSchema = new mongoose.Schema({
  participants: [
    {
      participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      lastSeenMsgId: messageIdSchema,
    },
  ],
  messages: [messageSchema],
});

const chatModel = new mongoose.model("Chat", chatSchema);
module.exports = { Chat: chatModel };
