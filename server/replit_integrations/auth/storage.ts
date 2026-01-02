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

// Seed credentials from environment if SEED_CREDENTIALS is set
export async function seedUserCredentials() {
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
