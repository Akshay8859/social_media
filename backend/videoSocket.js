function setupVideoSocket(io) {
  const videoNamespace = io.of("/video");

  videoNamespace.on("connection", (socket) => {
    console.log("📹 [Video] User connected:", socket.id);

    socket.on("join-random", () => {
      if (waitingUser) {
        // Match found! Connect the current user and waiting user
        const userA = waitingUser;
        const userB = socket.id;

        io.to(userA).emit("match-found", userB);
        io.to(userB).emit("match-found", userA);

        waitingUser = null; // Clear the waiting user
      } else {
        // No one is waiting, store this user
        waitingUser = socket.id;
      }
    });

    socket.on("offer", ({ to, offer }) => {
      io.to(to).emit("offer", { from: socket.id, offer });
    });


    socket.on("answer", ({ to, answer }) => {
      io.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("leaveCall", ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit("userLeft");
    });

    socket.on("disconnect", () => {
      console.log("❌ [Video] User disconnected:", socket.id);
    });
  });
}

module.exports = setupVideoSocket;
