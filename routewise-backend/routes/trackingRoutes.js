// trackingRoutes.js — fixed version
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// POST /api/tracking/update — store new location ping
router.post("/update", async (req, res) => {
  const { event_id, latitude, longitude } = req.body;

  if (!event_id || latitude == null || longitude == null) {
    return res.status(400).json({ message: "event_id, latitude, and longitude are required" });
  }

  try {
    await pool.query(
      `INSERT INTO tracking_logs (event_id, latitude, longitude, recorded_at)
       VALUES ($1, $2, $3, NOW())`,
      [event_id, latitude, longitude]
    );
    res.json({ message: "Location updated", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[Tracking] DB error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tracking/:eventId — fetch last N positions for an event
router.get("/:eventId", async (req, res) => {
  const { eventId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  try {
    const result = await pool.query(
      `SELECT latitude, longitude, recorded_at
       FROM tracking_logs
       WHERE event_id = $1
       ORDER BY recorded_at DESC
       LIMIT $2`,
      [eventId, limit]
    );
    res.json(result.rows.reverse()); // chronological order for the client
  } catch (err) {
    console.error("[Tracking] Fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

