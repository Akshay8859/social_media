const { pool } = require("../db");

function setupChatSocket(io) {
  const chatNamespace = io.of("/chat");
  const userIdToSocket = new Map();

  chatNamespace.on("connection", (socket) => {
    console.log("💬 [Chat] User connected:", socket.id);

    socket.on("registerUser", (userId) => {
      userIdToSocket.set(userId, socket.id);
      console.log(`🆔 [Chat] Registered ${userId} to ${socket.id}`);
    });

    socket.on("joinRoom", ({ userId, roomId }) => {
      socket.join(roomId);
      console.log(`🫂 [Chat] ${userId} joined room ${roomId}`);
    });

    socket.on("sendMessage", async ({ userId, roomId, messageData }) => {
      console.log("📨 [Chat] Message received:", messageData);
      await pool.query(
        `UPDATE chats
         SET messages = messages || jsonb_build_object($1, $2) 
         WHERE id = $3`,
        [userId, messageData, roomId]
      );

      socket.to(roomId).emit("receiveMessage", messageData);
    });

    socket.on("disconnect", () => {
      console.log("❌ [Chat] User disconnected:", socket.id);
    });
  });
}

module.exports = {setupChatSocket};
