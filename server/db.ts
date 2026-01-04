import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use SupabaseDATABASE for auth tables (works in both dev and production)
// Fall back to DATABASE_URL for local development if SupabaseDATABASE not set
const connectionString = process.env.SupabaseDATABASE || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("SupabaseDATABASE or DATABASE_URL environment variable is not set");
}

// Export for use in session store
export const authDatabaseUrl = connectionString;

const pool = new Pool({
  connectionString,
  ssl: process.env.SupabaseDATABASE ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

// Transient error codes that should trigger retry
const TRANSIENT_ERROR_CODES = [
  'EAI_AGAIN',      // DNS lookup timeout
  'ETIMEDOUT',      // Connection timeout
  'ECONNRESET',     // Connection reset
  'ECONNREFUSED',   // Connection refused
  'ENOTFOUND',      // DNS resolution failed
  'EPIPE',          // Broken pipe
  '57P01',          // PostgreSQL: terminating connection due to administrator command
  '57P02',          // PostgreSQL: crash shutdown
  '57P03',          // PostgreSQL: cannot connect now
  '08000',          // PostgreSQL: connection exception
  '08003',          // PostgreSQL: connection does not exist
  '08006',          // PostgreSQL: connection failure
];

function isTransientError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error.errno || '';
  const message = error.message || '';
  
  // Check error codes
  if (TRANSIENT_ERROR_CODES.includes(code)) return true;
  
  // Check error message patterns
  if (message.includes('EAI_AGAIN')) return true;
  if (message.includes('ETIMEDOUT')) return true;
  if (message.includes('ECONNRESET')) return true;
  if (message.includes('getaddrinfo')) return true;
  
  return false;
}

// Retry wrapper for database operations with exponential backoff
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (!isTransientError(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 100;
      console.log(`[db] Transient error (${error.code || error.message}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
