const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const { create } = require("../models/user");

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("$"))
    .digest("hex");
};

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: ["http://localhost:5173", "https://devgram-theta.vercel.app"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    // Parse cookies from handshake headers
    cookieParser()(socket.request, {}, (err) => {
      if (err) return next(err);

      const token = socket.request.cookies?.token; // use your cookie name

      if (!token) return next(new Error("Unauthorized"));

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = {
          userId: decoded.userId,
        };
        next();
      } catch (err) {
        next(new Error("Unauthorized"));
      }
    });
  });

  io.on("connection", (socket) => {
    const userId = socket.user.userId;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    socket.on("getAllOnlineUsers", () => {
      const onlineUsersList = [...onlineUsers.keys()];
      socket.emit("allOnlineUsers", { onlineUsersList });
    });
    // socket.emit("allOnlineUsers", { onlineUsersList });
    socket.broadcast.emit("userOnline", { userId });

    console.log(
      `✅ ${socket.user.userId} is online. Total: ${onlineUsers.size}`
    );

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      if (socket.user.userId !== userId) return;
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(firstName + " joined Room : " + roomId);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetUserId, text }) => {
        // Save messages to the database
        try {
          if (socket.user.userId !== userId) return;
          const roomId = getSecretRoomId(userId, targetUserId);

          let connectionRequest = await ConnectionRequest.findOne({
            $or: [
              {
                fromUserId: userId,
                toUserId: targetUserId,
                status: "accepted",
              },
              {
                fromUserId: targetUserId,
                toUserId: userId,
                status: "accepted",
              },
            ],
          });

          if (!connectionRequest) {
            console.log("Blocked sendMessage: users are not connected");
            socket.emit("errorMessage", {
              code: "NOT_CONNECTED",
              message: "You can only chat with accepted connections.",
            });
            return;
          }

          let chat = await Chat.findOne({
            participants: {
              $all: [
                { $elemMatch: { participantId: userId } },
                { $elemMatch: { participantId: targetUserId } },
              ],
            },
          });

          if (!chat) {
            const chatId = new mongoose.Types.ObjectId();
            chat = new Chat({
              _id: chatId,
              participants: [
                { participantId: userId },
                { participantId: targetUserId },
              ],
              messages: [],
            });
            await chat.save();
          }
          const messageId = new mongoose.Types.ObjectId();
          const createdAt = new Date();
          chat.messages.push({
            senderId: userId,
            text,
            _id: messageId,
            createdAt: createdAt,
          });

          await chat.save();
          io.to(roomId).emit("messageReceived", {
            firstName,
            lastName,
            text,
            messageId,
            chatId: chat._id,
            senderId: userId,
            createdAt,
          });
        } catch (err) {
          console.log(err);
        }
      },
      socket.on(
        "messageDelivered",
        async ({ currentUserId, chatId, messageId, targetUserId }) => {
          console.log("delivered message id", messageId);
          const msgObjectId = new mongoose.Types.ObjectId(messageId);
          const userObjectId = new mongoose.Types.ObjectId(currentUserId);
          const chatObjectId = new mongoose.Types.ObjectId(chatId);

          const updatedChat = await Chat.findOneAndUpdate(
            {
              _id: chatObjectId,
              // "participants.participantId": userObjectId,
              "messages._id": msgObjectId,
            },
            {
              // $set: { "participants.$.lastSeenMsgId": msgObjectId },
              $addToSet: { "messages.$.seenBy": userObjectId },
            },
            { new: true }
          );
          console.log("updatedChat", updatedChat);

          if (!updatedChat) return;

          // Find the updated message inside the array
          const updatedMessage = updatedChat.messages.id(messageId);
          console.log(
            "updatedMessage",
            updatedMessage,
            "currentUserId",
            currentUserId
          );
          if (!updatedMessage) return;

          const seenBy = updatedMessage.seenBy || [];
          console.log("emitting seenBy", seenBy);

          const roomId = getSecretRoomId(currentUserId, targetUserId);

          socket.to(roomId).emit("messageSeen", { messageId, seenBy });
        }
      )
    );

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast to ALL users: this user went offline
          io.emit("userOffline", { userId });
          console.log(`❌ ${socket.user.userId} went offline`);
        }
      }
    });
  });
};

module.exports = initializeSocket;
