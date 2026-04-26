const { Client } = require("pg");

const client = new Client({
  connectionString:
    "postgresql://neondb_owner:npg_UIkVD45RKpsn@ep-morning-pine-adnlphc1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to DB");

    const res = await client.query("SELECT NOW()");
    console.log("Time:", res.rows);

    await client.end();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

connectDB();
