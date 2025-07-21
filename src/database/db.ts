import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import schema from "./schema/index.js";
import 'dotenv/config';

// Connection pool configuration for optimal performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Health check function for monitoring
export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// Graceful shutdown for clean deployment
export async function closeConnection(): Promise<void> {
  await pool.end();
}

export default db; 