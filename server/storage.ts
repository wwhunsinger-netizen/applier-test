import type {
  TestSubmission,
  InsertTestSubmission,
} from "@shared/schema";
import { supabase } from "./supabase";

export interface IStorage {
  createTestSubmission(submission: InsertTestSubmission): Promise<TestSubmission>;
  getTestSubmissionByEmail(email: string): Promise<TestSubmission | null>;
}

export class SupabaseStorage implements IStorage {
  async createTestSubmission(submission: InsertTestSubmission): Promise<TestSubmission> {
    const { data, error } = await supabase
      .from("test_submissions")
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTestSubmissionByEmail(email: string): Promise<TestSubmission | null> {
    const { data, error } = await supabase
      .from("test_submissions")
      .select("*")
      .eq("candidate_email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export const storage = new SupabaseStorage();
