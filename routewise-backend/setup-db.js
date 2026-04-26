import { neonConfig, Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import ws from 'ws';
import bcrypt from 'bcryptjs';

config();
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupDB() {
  try {
    // 1. Events Table - Ensuring all columns exist
    console.log("Setting up events table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        date VARCHAR(50),
        "startLocation" VARCHAR(255),
        "endLocation" VARCHAR(255),
        "startTime" VARCHAR(50),
        "endTime" VARCHAR(50),
        start_lat DOUBLE PRECISION,
        start_lon DOUBLE PRECISION,
        end_lat DOUBLE PRECISION,
        end_lon DOUBLE PRECISION,
        status VARCHAR(50) DEFAULT 'upcoming',
        event_type VARCHAR(50) DEFAULT 'other',
        venue_id INTEGER,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check existing columns to avoid errors on duplicate addition
    const columnsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events'");
    const columnNames = columnsRes.rows.map(c => c.column_name);
    
    const missingColumns = [
      { name: 'description', type: 'TEXT' },
      { name: 'startLocation', type: 'VARCHAR(255)', quoted: true },
      { name: 'endLocation', type: 'VARCHAR(255)', quoted: true },
      { name: 'startTime', type: 'VARCHAR(50)', quoted: true },
      { name: 'endTime', type: 'VARCHAR(50)', quoted: true },
      { name: 'start_lat', type: 'DOUBLE PRECISION' },
      { name: 'start_lon', type: 'DOUBLE PRECISION' },
      { name: 'end_lat', type: 'DOUBLE PRECISION' },
      { name: 'end_lon', type: 'DOUBLE PRECISION' },
      { name: 'status', type: 'VARCHAR(50) DEFAULT \'upcoming\'' },
      { name: 'event_type', type: 'VARCHAR(50) DEFAULT \'other\'' },
      { name: 'venue_id', type: 'INTEGER' },
      { name: 'user_id', type: 'INTEGER' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const col of missingColumns) {
      if (!columnNames.map(n => n.toLowerCase()).includes(col.name.toLowerCase())) {
        console.log(`Adding '${col.name}' column to events...`);
        const colName = col.quoted ? `"${col.name}"` : col.name;
        await pool.query(`ALTER TABLE events ADD COLUMN ${colName} ${col.type}`);
      }
    }

    // 2. Venues Table
    console.log("Setting up venues table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        location VARCHAR(255),
        service_road_available BOOLEAN DEFAULT FALSE,
        internal_route TEXT,
        capacity INTEGER,
        contact VARCHAR(100),
        user_id INTEGER,
        approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check for missing columns in venues
    const venueColsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'venues'");
    const venueColNames = venueColsRes.rows.map(c => c.column_name);
    
    if (!venueColNames.includes('address')) await pool.query("ALTER TABLE venues ADD COLUMN address VARCHAR(255)");
    if (!venueColNames.includes('service_road_available')) await pool.query("ALTER TABLE venues ADD COLUMN service_road_available BOOLEAN DEFAULT FALSE");
    if (!venueColNames.includes('internal_route')) await pool.query("ALTER TABLE venues ADD COLUMN internal_route TEXT");
    if (!venueColNames.includes('user_id')) await pool.query("ALTER TABLE venues ADD COLUMN user_id INTEGER");

    // 3. Tracking Logs Table
    console.log("Setting up tracking logs table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracking_logs (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Users Table
    console.log("Setting up users table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        points INTEGER DEFAULT 0,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add missing columns if they don't exist
    const userColumnsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    const userColumnNames = userColumnsRes.rows.map(c => c.column_name);

    if (!userColumnNames.includes('points')) {
      console.log("Adding 'points' column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0");
    }
    if (!userColumnNames.includes('avatar_url')) {
      console.log("Adding 'avatar_url' column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN avatar_url TEXT");
    }

    // 5. Default Admin User
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", ["admin@routewise.com"]);
    if (userRes.rows.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ["Admin User", "admin@routewise.com", hashedPassword, "admin"]
      );
      console.log("Default admin user created: admin@routewise.com / admin123");
    } else {
      console.log("Admin user already exists.");
    }

    console.log("Database setup complete!");
  } catch (e) {
    console.error("Error setting up database:", e);
  } finally {
    await pool.end();
  }
}

setupDB();
