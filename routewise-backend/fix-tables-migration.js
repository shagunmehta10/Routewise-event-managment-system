import { neonConfig, Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import ws from 'ws';

config();
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    console.log("Checking columns in 'events' table...");
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events'");
    const columnNames = colRes.rows.map(c => c.column_name);
    console.log("Current columns:", columnNames);

    if (!columnNames.includes('event_type')) {
      console.log("Adding 'event_type' to 'events'...");
      await pool.query("ALTER TABLE events ADD COLUMN event_type VARCHAR(50) DEFAULT 'other'");
    }

    if (!columnNames.includes('venue_id')) {
      console.log("Adding 'venue_id' to 'events'...");
      await pool.query("ALTER TABLE events ADD COLUMN venue_id INTEGER");
    }

    console.log("Setting up 'venues' table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        service_road_available BOOLEAN DEFAULT FALSE,
        internal_route BOOLEAN DEFAULT FALSE,
        user_id INTEGER,
        approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if venue table columns exist
    const venueCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'venues'");
    const venueColNames = venueCols.rows.map(c => c.column_name);
    console.log("Venues columns:", venueColNames);

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

migrate();
