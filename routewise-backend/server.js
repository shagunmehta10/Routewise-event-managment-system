import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import socketHandler from "./socket/socketHandler.js";
import { ensureSettingsColumn } from "./controllers/authController.js";
import { ensureVenuesTable } from "./controllers/venueController.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5000;

// Register socket event handlers
socketHandler(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tracking", trackingRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "RouteWise Backend API is running" });
});

// Test DB connection on startup
async function testDB() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("DB Connected:", res.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  }
}

const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testDB();
  
  // Ensure required columns exist
  pool.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS penalty INTEGER DEFAULT 0")
    .catch(err => console.error("Could not add penalty column:", err.message));
  ensureSettingsColumn();
  ensureVenuesTable();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using this port or choose a different one.`);
    process.exit(1);
  } else {
    throw err;
  }
});
