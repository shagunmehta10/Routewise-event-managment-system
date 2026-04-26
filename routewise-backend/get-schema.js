import { neonConfig, Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import ws from 'ws';

config();

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function describeDB() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log("Found Tables:", tables);

    for (const tableName of tables) {
      const colsRes = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns  
        WHERE table_name = $1
      `, [tableName]);
      
      console.log(`\n--- Table: ${tableName} ---`);
      colsRes.rows.forEach(c => {
        console.log(`  - ${c.column_name.padEnd(20)} | ${c.data_type.padEnd(15)} | Nullable: ${c.is_nullable}`);
      });
    }
  } catch(e) { 
    console.error("Error inspecting database:", e); 
  } finally { 
    await pool.end(); 
  }
}

describeDB();
