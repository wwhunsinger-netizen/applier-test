import { z } from "zod";

// ============================================
// Test Submissions (Applier Assessment V2)
// ============================================

export interface TestSubmission {
  id: string;
  candidate_name: string;
  candidate_email: string;
  passed: boolean;
  overall_score: number;
  // Typing
  typing_wpm: number;
  typing_accuracy: number;
  typing_score: number;
  // Reviews
  review_score: number;
  review_details: Record<number, {
    correctFlags: number;
    falseFlags: number;
    totalErrors: number;
  }>;
  // Application fill-out
  app_correct_count: number;
  app_total_scored: number;
  app_score: number;
  // Screening
  screening_answers: Record<string, string>;
  // Time
  elapsed_seconds: number;
  created_at?: string;
  invited_at?: string | null;
}

export const insertTestSubmissionSchema = z.object({
  candidate_name: z.string().min(1),
  candidate_email: z.string().email(),
  passed: z.boolean(),
  overall_score: z.number().int().min(0).max(100),
  typing_wpm: z.number().int().min(0),
  typing_accuracy: z.number().int().min(0).max(100),
  typing_score: z.number().int().min(0).max(100),
  review_score: z.number().int().min(0).max(100),
  review_details: z.record(z.object({
    correctFlags: z.number(),
    falseFlags: z.number(),
    totalErrors: z.number(),
  })),
  app_correct_count: z.number().int().min(0),
  app_total_scored: z.number().int().min(0),
  app_score: z.number().int().min(0).max(100),
  screening_answers: z.record(z.string()),
  elapsed_seconds: z.number().int().min(0),
});

export type InsertTestSubmission = z.infer<typeof insertTestSubmissionSchema>;
