const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

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
            participants: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          chat.messages.push({
            senderId: userId,
            text,
          });

          await chat.save();
          io.to(roomId).emit("messageReceived", { firstName, lastName, text });
        } catch (err) {
          console.log(err);
        }
      }
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
