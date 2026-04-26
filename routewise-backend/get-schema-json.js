import { neonConfig, Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import ws from 'ws';
import fs from 'fs';

config();
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function describeDB() {
  const schema = {};
  try {
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      const colsRes = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1", [tableName]);
      schema[tableName] = colsRes.rows;
    }
    fs.writeFileSync('schema.json', JSON.stringify(schema, null, 2));
    console.log("Schema saved to schema.json");
  } catch(e) { 
    console.error(e); 
  } finally { 
    await pool.end(); 
  }
}
describeDB();
