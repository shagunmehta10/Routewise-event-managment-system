import { neonConfig, Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import ws from 'ws';
config();
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events'");
  console.log("COLUMNS:", r.rows.map(c => c.column_name));
  
  // Check if there are any events
  const events = await pool.query("SELECT * FROM events LIMIT 2");
  console.log("SAMPLE EVENT KEYS:", events.rows.length > 0 ? Object.keys(events.rows[0]) : 'no events');
  if (events.rows.length > 0) console.log("SAMPLE EVENT:", JSON.stringify(events.rows[0], null, 2));
  
  await pool.end();
}
check();
