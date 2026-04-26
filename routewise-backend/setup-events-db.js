const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "routewise",
  password: "Shagun@10",
  port: 5432,
});

async function setupEvents() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        date VARCHAR(50),
        "startLocation" VARCHAR(255),
        "endLocation" VARCHAR(255),
        status VARCHAR(50) DEFAULT 'upcoming'
      );
    `);
    console.log("events table created or already exists!");
    
    // Insert mock events if empty
    const res = await pool.query("SELECT COUNT(*) FROM events");
    if (res.rows[0].count == 0) {
      await pool.query(`
        INSERT INTO events (name, description, date, "startLocation", "endLocation", status)
        VALUES 
        ('City Marathon 2026', 'Annual city marathon event with 5000+ participants', '2026-03-15', 'City Hall', 'Central Park', 'upcoming'),
        ('Tech Conference', 'Technology conference with international speakers', '2026-04-20', 'Convention Center', 'Tech Hub', 'upcoming'),
        ('Music Festival', 'Summer music festival featuring local and international artists', '2026-06-10', 'Beach Arena', 'Coastal Plaza', 'upcoming');
      `);
      console.log("Inserted mock events.");
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
setupEvents();
