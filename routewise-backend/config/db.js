import dotenv from "dotenv";
dotenv.config();
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Use WebSocket polyfill for Node.js
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
