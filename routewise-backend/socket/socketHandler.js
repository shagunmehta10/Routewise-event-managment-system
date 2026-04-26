// socketHandler.js — ESM
export default (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Broadcast live location to all OTHER clients (not the sender)
    socket.on("liveLocation", (data) => {
      socket.broadcast.emit("updateLocation", {
        ...data,
        socketId: socket.id,
        timestamp: Date.now(),
      });
    });

    // Emergency alert — broadcast to everyone including sender
    socket.on("emergencyAlert", (data) => {
      io.emit("clearRoute", {
        ...data,
        socketId: socket.id,
        timestamp: Date.now(),
      });
    });

    // Join an event room so tracking is scoped per event
    socket.on("joinEvent", (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`[Socket] ${socket.id} joined event room: ${eventId}`);
    });

    // Per-event live location (only visible to that event's room)
    socket.on("liveLocationForEvent", ({ eventId, ...data }) => {
      socket.to(`event:${eventId}`).emit("updateLocation", {
        ...data,
        eventId,
        socketId: socket.id,
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
};

