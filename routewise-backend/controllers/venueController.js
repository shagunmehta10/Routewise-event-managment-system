import pool from "../config/db.js";

// ── Ensure venues table exists (safe migration) ─────────────────────────────
export const ensureVenuesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venues (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        address     TEXT NOT NULL,
        service_road_available BOOLEAN DEFAULT FALSE,
        internal_route TEXT,
        user_id     INTEGER,
        approved    BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("[DB] venues table ready");
  } catch (err) {
    console.warn("[DB] Could not ensure venues table:", err.message);
  }
};

// Register Venue Controller
export const registerVenue = async (req, res) => {
  const { name, address, service_road_available, internal_route, user_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO venues (name, address, service_road_available, internal_route, user_id, approved) VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING *",
      [name, address, service_road_available, internal_route, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error registering venue:", error);
    res.status(500).json({ message: "Server error while registering venue" });
  }
};

// Get All Venues Controller
export const getAllVenues = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM venues ORDER BY name ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ message: "Server error while fetching venues" });
  }
};

// Get Venue by ID Controller
export const getVenueById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM venues WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Venue not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(500).json({ message: "Server error while fetching venue" });
  }
};

// Approve Venue Controller (Admin/Authority only)
export const approveVenue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE venues SET approved = TRUE WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Venue not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error approving venue:", error);
    res.status(500).json({ message: "Server error while approving venue" });
  }
};

// Update Venue Controller
export const updateVenue = async (req, res) => {
  const { id } = req.params;
  const { name, address, service_road_available, internal_route } = req.body;
  try {
    const result = await pool.query(
      "UPDATE venues SET name = $1, address = $2, service_road_available = $3, internal_route = $4 WHERE id = $5 RETURNING *",
      [name, address, service_road_available, internal_route, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Venue not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).json({ message: "Server error while updating venue" });
  }
};

// Delete Venue Controller
export const deleteVenue = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM venues WHERE id = $1", [id]);
    res.json({ message: "Venue deleted successfully" });
  } catch (error) {
    console.error("Error deleting venue:", error);
    res.status(500).json({ message: "Server error while deleting venue" });
  }
};
