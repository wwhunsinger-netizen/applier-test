import { users, userCredentials, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

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
