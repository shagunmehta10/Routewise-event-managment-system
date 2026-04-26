import { neonConfig, Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import ws from 'ws';

config();
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixVenuesTable() {
  try {
    console.log("Fixing 'internal_route' column type in 'venues' table...");
    
    // 1. Check current type
    const res = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'internal_route'");
    
    if (res.rows.length > 0 && res.rows[0].data_type === 'boolean') {
      console.log("Column 'internal_route' is boolean. Converting to TEXT...");
      
      // We need to drop the default if any, or just alter type.
      // Since it's currently boolean, we can't directly cast it to text easily if it has data, 
      // but if it's empty or we don't care about the boolean data, we can just drop and recreate or alter with USING.
      await pool.query("ALTER TABLE venues ALTER COLUMN internal_route TYPE TEXT USING (CASE WHEN internal_route THEN 'true' ELSE 'false' END)");
      // Actually, better to just set it to empty string if it's currently boolean
      await pool.query("ALTER TABLE venues ALTER COLUMN internal_route SET DEFAULT ''");
      await pool.query("UPDATE venues SET internal_route = '' WHERE internal_route IS NOT NULL");
      
      console.log("Conversion successful.");
    } else {
      console.log("Column 'internal_route' is already correct or not found.");
    }

  } catch (error) {
    console.error("Fix failed:", error);
  } finally {
    await pool.end();
  }
}

fixVenuesTable();
