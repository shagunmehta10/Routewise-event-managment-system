import { neonConfig, Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import ws from 'ws';

config();
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function describeDB() {
  try {
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log("Tables:", tablesRes.rows.map(r => r.table_name));

    for (const row of tablesRes.rows) {
      const colsRes = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${row.table_name}'`);
      console.log(`\nTable ${row.table_name} columns:`);
      colsRes.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    }
  } catch(e) { 
    console.error("Error describing DB:", e.message); 
  } finally { 
    await pool.end(); 
  }
}
describeDB();
