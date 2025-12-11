import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;

// Improved connection pool configuration for Neon PostgreSQL
// These settings help with stability and prevent connection issues
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings for better reliability
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
  // For Neon serverless, we want to keep connections alive but not too many
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle pool errors gracefully - don't crash the server
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  // Don't exit - let the server continue running
  // Individual queries will handle their own errors
});

// Handle connection errors
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});

export const db = drizzle(pool);
