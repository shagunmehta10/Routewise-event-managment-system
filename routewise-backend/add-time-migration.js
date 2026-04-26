import pool from './config/db.js';

async function migrate() {
  try {
    await pool.query('ALTER TABLE events ADD COLUMN "startTime" VARCHAR(50)');
    await pool.query('ALTER TABLE events ADD COLUMN "endTime" VARCHAR(50)');
    console.log("Migration successful: added startTime and endTime to events table.");
  } catch (error) {
    console.error("Migration error (maybe cols already exist):", error);
  } finally {
    pool.end();
  }
}

migrate();
