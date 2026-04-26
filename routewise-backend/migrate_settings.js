import pool from "./config/db.js";

async function migrate() {
  try {
    console.log("Checking database schema...");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'");
    console.log("Success: 'settings' column verified in 'users' table.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failure:", err);
    process.exit(1);
  }
}

migrate();
