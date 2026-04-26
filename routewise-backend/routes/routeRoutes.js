import express from "express";
import axios from "axios";

const router = express.Router();

// GET /api/routes/geocode?q=...
router.get("/geocode", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query is required" });

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=in`,
      { headers: { 'User-Agent': 'RouteWise-Backend/1.0' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Geocode error:", error.message);
    res.status(500).json({ message: "Geocoding service error" });
  }
});

// GET /api/routes/search?q=...
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query is required" });

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
      { headers: { 'User-Agent': 'RouteWise-Backend/1.0' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ message: "Search service error" });
  }
});

export default router;
