import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced pool configuration for Cloud Run deployment
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduced for Cloud Run environment
  min: 0, // Allow pool to scale down to 0
  connectionTimeoutMillis: 10000, // Increased timeout for Cloud Run
  idleTimeoutMillis: 30000,
  allowExitOnIdle: true, // Allow process to exit when pool is idle
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Add error handling for pool events
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

pool.on('connect', (client) => {
  console.log('PostgreSQL client connected');
});

pool.on('remove', (client) => {
  console.log('PostgreSQL client removed');
});

// Test database connection on startup
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export const db = drizzle({ client: pool, schema });