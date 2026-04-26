import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

console.log("ENV TEST:", process.env.DATABASE_URL);

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import socketHandler from "./socket/socketHandler.js";
import { setIO } from "./socket/socketUtils.js";
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

setIO(io);

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
app.use("/api/routes", routeRoutes);

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
  pool
    .query(
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS penalty INTEGER DEFAULT 0",
    )
    .catch((err) =>
      console.error("Could not add penalty column:", err.message),
    );
  pool
    .query(
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE",
    )
    .catch((err) =>
      console.error("Could not add is_private column:", err.message),
    );
  ensureSettingsColumn();
  ensureVenuesTable();
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please kill the process using this port or choose a different one.`,
    );
    process.exit(1);
  } else {
    throw err;
  }
});
