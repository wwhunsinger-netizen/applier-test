import { users, userCredentials, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface UserCredentials {
  user_id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
}

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserCredentials(email: string): Promise<UserCredentials | null>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserCredentials(email: string): Promise<UserCredentials | null> {
    const [cred] = await db
      .select()
      .from(userCredentials)
      .where(eq(userCredentials.email, email.toLowerCase()));
    
    if (!cred) return null;
    
    return {
      user_id: cred.userId,
      email: cred.email,
      password_hash: cred.passwordHash,
      first_name: cred.firstName,
      last_name: cred.lastName,
    };
  }
}

export const authStorage = new AuthStorage();

// Create or update user credentials - used by admin to manage user accounts
export async function upsertUserCredentials(userData: {
  userId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  const passwordHash = await bcrypt.hash(userData.password, 10);
  const email = userData.email.toLowerCase();
  
  const existing = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.email, email));
  
  if (existing.length === 0) {
    await db.insert(userCredentials).values({
      userId: userData.userId,
      email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
    });
  } else {
    await db
      .update(userCredentials)
      .set({
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
      })
      .where(eq(userCredentials.email, email));
  }
}

// Ensure auth tables exist in database
async function ensureAuthTables() {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Enable pgcrypto extension for gen_random_uuid()
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    
    // Create user_credentials table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        user_id VARCHAR PRIMARY KEY,
        email VARCHAR NOT NULL UNIQUE,
        password_hash VARCHAR NOT NULL,
        first_name VARCHAR,
        last_name VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create sessions table if it doesn't exist (for connect-pg-simple)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire)`);
    
    console.log("[auth] Auth tables verified/created");
  } catch (error) {
    console.error("[auth] Failed to create auth tables:", error);
  } finally {
    await pool.end();
  }
}

// Seed credentials from environment if SEED_CREDENTIALS is set
export async function seedUserCredentials() {
  // First ensure tables exist
  await ensureAuthTables();
  
  const seedData = process.env.SEED_CREDENTIALS;
  if (!seedData) {
    return; // No seeding without environment variable
  }
  
  try {
    const users = JSON.parse(seedData);
    for (const user of users) {
      await upsertUserCredentials(user);
      console.log(`[auth] Seeded credentials for ${user.email}`);
    }
  } catch (error) {
    console.error("[auth] Failed to parse SEED_CREDENTIALS:", error);
  }
}
