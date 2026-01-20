import { z } from "zod";

// Export auth models for Replit Auth
export * from "./models/auth";

export type UserRole = "Admin" | "Client" | "Applier";

export type ClientStatus =
  | "onboarding_not_started"
  | "onboarding_in_progress"
  | "active"
  | "paused"
  | "placed";

export type RevisionStatus = "requested" | "completed" | null;

export interface DocumentFeedbackItem {
  text: string;
  status: RevisionStatus;
}

export interface DocumentFeedback {
  resume: DocumentFeedbackItem;
  "cover-letter": DocumentFeedbackItem;
  linkedin: DocumentFeedbackItem;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  created_at?: string;
  applier_id?: string | null;
  updated_at?: string;
  status: ClientStatus;
  comments_count?: number;
  applications_sent?: number;
  interviews_scheduled?: number;
  job_criteria_signoff: boolean;
  resume_approved: boolean;
  cover_letter_approved: boolean;
  resume_url?: string;
  cover_letter_url?: string;
  resume_text?: string;
  client_gmail?: string;
  client_gmail_password?: string;
  target_job_titles?: string[];
  required_skills?: string[];
  nice_to_have_skills?: string[];
  exclude_keywords?: string[];
  years_of_experience?: number;
  seniority_levels?: string[];
  onboarding_transcript?: string;
  daily_application_target?: number;
  first_application_date?: string;
  last_application_date?: string;
  placement_date?: string;
  document_feedback?: DocumentFeedback;
}

// Applier status is automatically tracked via WebSocket presence:
// - active: Currently online and interacting with the app
// - idle: Logged in but no activity for 2+ minutes
// - offline: Not connected (logged out or closed browser)
// - inactive: Account disabled by admin (cannot log in)
export type ApplierStatus = "active" | "idle" | "offline" | "inactive";

export interface Applier {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: ApplierStatus;
  is_active: boolean; // Account enabled/disabled by admin
  assigned_client_ids?: string[]; // Array of client IDs this applier works with
  last_activity_at?: string; // Tracks last activity for idle detection
  created_at?: string;
  updated_at?: string;
}

// Helper function to get applier full name
export function getApplierFullName(applier: Applier): string {
  return `${applier.first_name} ${applier.last_name}`.trim();
}

// @deprecated - Use DisplayJob for new code. This interface will be removed after migration.
export interface Job {
  id: string;
  client_id: string;
  applier_id?: string;
  job_title: string;
  company_name: string;
  job_url: string;
  status?: string;
  job_description?: string;
  job_location?: string;
  posted_date?: string;
  scraped_at?: string;
  board_source: string;
  feed_job_id?: number;
  feed_source?: string;
  // Legacy fields for backwards compatibility
  role?: string;
  company?: string;
  location?: string;
  posted_time?: string;
  match_score?: number;
  requirements?: string[];
}

// ============================================
// Feed API Types (cofounder's job database)
// ============================================

export interface FeedJobDataPoint {
  id: number;
  title: string;
  company: string;
  company_logo: string | null;
  job_location: string | null;
  source_url: string;
  apply_url: string;
  posted_day: string;
}

export interface FeedJob {
  canonical_job_id: number;
  job_data_points: FeedJobDataPoint[];
  admin_note: string | null;
}

// Display format for UI (flattened from FeedJob)
export interface DisplayJob {
  id: number; // canonical_job_id
  job_title: string;
  company_name: string;
  company_logo: string | null;
  job_url: string;
  job_location: string | null;
  source_url: string;
  posted_date: string;
  admin_note: string | null;
}

export interface FeedAppliedJob {
  canonical_job_id: number;
  applier: string;
  status: number;
  duration_seconds: number;
  applied_at: string;
  job_data_points: FeedJobDataPoint[];
}

export interface FeedFlaggedJob {
  canonical_job_id: number;
  applier: string;
  comment: string;
  flagged_at: string;
  resolved: boolean;
  resolution_note: string | null;
  job_data_points: FeedJobDataPoint[];
}

export interface Application {
  id: string;
  job_id?: string | null; // Optional - legacy reference to local jobs table
  applier_id: string;
  client_id: string;
  status: string;
  qa_status?: string;
  feed_job_id: number; // Required - cofounder's canonical_job_id
  feed_source?: string;
  applied_at?: string;
  applied_date?: string;
  flagged_issue?: string;
  // Job snapshot fields (NOT NULL in Supabase)
  job_title: string;
  company_name: string;
  job_url: string;
  // LinkedIn and source tracking
  linkedin_url?: string | null;
  source?: string | null;
  // Resume used for this application
  optimized_resume_url?: string | null;
  // Follow-up tracking
  followed_up?: boolean;
  followup_method?: string | null;
  // Other optional fields
  status_updated_at?: string;
  email_verification_needed?: boolean;
  email_verified?: boolean;
  email_verified_at?: string;
  application_proof_url?: string;
  created_at?: string;
  updated_at?: string;
  duration_seconds?: number;
  prep_doc: string | null;
  prep_doc_generated_at: string | null;
}

export interface Interview {
  id: string;
  application_id: string;
  client_id: string;
  company_name: string;
  job_title: string;
  interview_datetime: string;
  interview_type?: string;
  google_calendar_event_id?: string;
  calendly_event_id?: string;
  prep_doc_url?: string;
  prep_doc_status?: string;
  status?: string;
  outcome?: string;
  outcome_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  username: string;
  avatar?: string;
}

// Document types: resume_original, resume_improved, cover_letter_original, cover_letter_A, cover_letter_B, cover_letter_C, linkedin_original, linkedin_improved
export type DocumentType =
  | "resume_original"
  | "resume_improved"
  | "cover_letter_original"
  | "cover_letter_A"
  | "cover_letter_B"
  | "cover_letter_C"
  | "linkedin_original"
  | "linkedin_improved";

export interface ClientDocument {
  id: string;
  client_id: string;
  document_type: DocumentType;
  object_path: string; // Path to file in object storage (e.g., /objects/uploads/uuid)
  file_name: string;
  content_type?: string;
  file_size?: number;
  created_at?: string;
  updated_at?: string;
}

// Minimal insert schema - only fields required to create a client
// Additional fields can be added via update after creation
export const insertClientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  status: z
    .enum([
      "onboarding_not_started",
      "onboarding_in_progress",
      "active",
      "paused",
      "placed",
    ])
    .default("onboarding_not_started"),
  resume_approved: z.boolean().default(false),
  cover_letter_approved: z.boolean().default(false),
  job_criteria_signoff: z.boolean().default(false),
});

export const updateClientSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  applier_id: z.string().nullable().optional(),
  status: z
    .enum([
      "onboarding_not_started",
      "onboarding_in_progress",
      "active",
      "paused",
      "placed",
    ])
    .optional(),
  applications_sent: z.number().optional(),
  interviews_scheduled: z.number().optional(),
  job_criteria_signoff: z.boolean().optional(),
  resume_approved: z.boolean().optional(),
  cover_letter_approved: z.boolean().optional(),
  resume_url: z.string().optional(),
  cover_letter_url: z.string().optional(),
  resume_text: z.string().optional(),
  client_gmail: z.string().optional(),
  client_gmail_password: z.string().optional(),
  target_job_titles: z.array(z.string()).optional(),
  required_skills: z.array(z.string()).optional(),
  nice_to_have_skills: z.array(z.string()).optional(),
  exclude_keywords: z.array(z.string()).optional(),
  years_of_experience: z.number().optional(),
  seniority_levels: z.array(z.string()).optional(),
  onboarding_transcript: z.string().optional(),
  daily_application_target: z.number().optional(),
  placement_date: z.string().optional(),
  document_feedback: z
    .object({
      resume: z.object({
        text: z.string(),
        status: z.enum(["requested", "completed"]).nullable(),
      }),
      "cover-letter": z.object({
        text: z.string(),
        status: z.enum(["requested", "completed"]).nullable(),
      }),
      linkedin: z.object({
        text: z.string(),
        status: z.enum(["requested", "completed"]).nullable(),
      }),
    })
    .optional(),
});

// Applier schemas for Supabase table
// Status is auto-managed: new appliers start as 'offline', presence system updates to active/idle
// is_active is admin-controlled: enables/disables the account
export const insertApplierSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  role: z.string().default("applier"), // Required by Supabase table
  status: z.enum(["active", "idle", "offline", "inactive"]).default("offline"),
  is_active: z.boolean().default(true),
  assigned_client_ids: z.array(z.string().uuid()).optional(),
});

export const updateApplierSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "idle", "offline", "inactive"]).optional(),
  is_active: z.boolean().optional(),
  assigned_client_ids: z.array(z.string().uuid()).optional(),
  last_activity_at: z.string().optional(),
});

export type InsertApplier = z.infer<typeof insertApplierSchema>;
export type UpdateApplier = z.infer<typeof updateApplierSchema>;

export const insertApplicationSchema = z.object({
  job_id: z.string().nullable().optional(), // Legacy - will be removed
  applier_id: z.string(),
  client_id: z.string(),
  feed_job_id: z.number(), // Required - cofounder's canonical_job_id
  feed_source: z.string().optional(),
  status: z.string().default("applied"),
  qa_status: z.string().optional(),
  applied_date: z.string().optional(),
  flagged_issue: z.string().optional(),
  duration_seconds: z.number().optional(),
  // Job snapshot fields (NOT NULL in Supabase)
  job_title: z.string(),
  company_name: z.string(),
  job_url: z.string(),
  // LinkedIn and source tracking
  linkedin_url: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  // Resume used for this application
  optimized_resume_url: z.string().nullable().optional(),
});

export const insertInterviewSchema = z.object({
  application_id: z.string().uuid(),
  client_id: z.string().uuid(),
  company_name: z.string(),
  job_title: z.string(),
  interview_datetime: z.string(),
  interview_type: z.string().optional(),
  prep_doc_status: z.string().default("pending"),
});

export const insertClientDocumentSchema = z.object({
  client_id: z.string().uuid(),
  document_type: z.enum([
    "resume_original",
    "resume_improved",
    "cover_letter_original",
    "cover_letter_A",
    "cover_letter_B",
    "cover_letter_C",
    "linkedin_original",
    "linkedin_improved",
  ]),
  object_path: z.string(), // Path to file in object storage
  file_name: z.string(),
  content_type: z.string().optional(),
  file_size: z.number().optional(),
});

// Job Criteria Sample - jobs scraped from URLs for client calibration
export type ScrapeStatus = "pending" | "complete" | "failed";

export interface JobCriteriaSample {
  id: string;
  client_id: string;
  title?: string | null;
  company_name?: string | null;
  location?: string;
  is_remote?: boolean;
  job_type?: string; // full-time, part-time, contract, etc.
  description?: string;
  required_skills?: string[]; // Extracted from job posting
  experience_level?: string; // junior, mid, senior, etc.
  source_url: string; // Original job posting URL
  apply_url?: string; // Direct apply link
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  company_logo_url?: string;
  scrape_status: ScrapeStatus;
  scraped_at?: string;
  raw_data?: Record<string, unknown>; // Full ParseWork API response
  created_at?: string;
}

export const insertJobCriteriaSampleSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  location: z.string().optional(),
  is_remote: z.boolean().optional(),
  job_type: z.string().optional(),
  description: z.string().optional(),
  required_skills: z.array(z.string()).optional(),
  experience_level: z.string().optional(),
  source_url: z.string().url(),
  apply_url: z.string().url().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  salary_currency: z.string().optional(),
  company_logo_url: z.string().url().optional(),
  scrape_status: z.enum(["pending", "complete", "failed"]).default("pending"),
  scraped_at: z.string().optional(),
  raw_data: z.record(z.unknown()).optional(),
});

// Client Job Response - client's yes/no verdict on sample jobs
export type JobVerdict = "yes" | "no";

export interface ClientJobResponse {
  id: string;
  client_id: string;
  sample_id: string; // FK to job_criteria_samples
  verdict: JobVerdict;
  comment?: string; // Required if verdict = "no"
  responded_at: string;
}

export const insertClientJobResponseSchema = z.object({
  client_id: z.string().uuid(),
  sample_id: z.string().uuid(),
  verdict: z.enum(["yes", "no"]),
  comment: z.string().optional(),
});

export const updateJobCriteriaSampleSchema = z.object({
  title: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  location: z.string().optional(),
  is_remote: z.boolean().optional(),
  job_type: z.string().optional(),
  description: z.string().optional(),
  required_skills: z.array(z.string()).optional(),
  experience_level: z.string().optional(),
  apply_url: z.string().url().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  salary_currency: z.string().optional(),
  company_logo_url: z.string().url().optional(),
  scrape_status: z.enum(["pending", "complete", "failed"]).optional(),
  scraped_at: z.string().optional(),
  raw_data: z.record(z.unknown()).optional(),
});

export type InsertJobCriteriaSample = z.infer<
  typeof insertJobCriteriaSampleSchema
>;
export type UpdateJobCriteriaSample = z.infer<
  typeof updateJobCriteriaSampleSchema
>;
export type InsertClientJobResponse = z.infer<
  typeof insertClientJobResponseSchema
>;

export type InsertClient = z.input<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type InsertClientDocument = z.infer<typeof insertClientDocumentSchema>;

// @deprecated - No longer used. Job sessions now tracked in cofounder's system.
// Applier Job Session - tracks applier workflow for each job (start, apply, flag)
// Job details (title, company, url) come from JOIN to jobs table
export type SessionStatus = "pending" | "in_progress" | "applied" | "flagged";

export interface ApplierJobSession {
  id: string;
  job_id: string;
  applier_id: string;
  status: SessionStatus;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  flag_comment?: string;
  created_at?: string;
  // Joined from jobs table (not stored in this table)
  job?: {
    job_title: string;
    company_name: string;
    job_url: string;
    client_id: string;
  };
}

export const insertApplierJobSessionSchema = z.object({
  job_id: z.string().uuid(),
  applier_id: z.string().uuid(),
  status: z
    .enum(["pending", "in_progress", "applied", "flagged"])
    .default("pending"),
});

export const updateApplierJobSessionSchema = z.object({
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  duration_seconds: z.number().optional(),
  status: z.enum(["pending", "in_progress", "applied", "flagged"]).optional(),
  flag_comment: z.string().optional(),
});

export type InsertApplierJobSession = z.infer<
  typeof insertApplierJobSessionSchema
>;
export type UpdateApplierJobSession = z.infer<
  typeof updateApplierJobSessionSchema
>;

// @deprecated - Use FeedFlaggedJob for new code. Flags now in cofounder's system.
// Flagged Application - for admin review queue
// Job/applier details come from session → job JOIN
export type FlagStatus = "open" | "resolved";

export interface FlaggedApplication {
  id: string;
  session_id: string;
  comment: string;
  status: FlagStatus;
  resolved_at?: string;
  resolution_note?: string;
  created_at?: string;
  // Joined from session → job (not stored in this table)
  session?: ApplierJobSession;
}

export const insertFlaggedApplicationSchema = z.object({
  session_id: z.string().uuid(),
  comment: z.string().min(1),
  status: z.enum(["open", "resolved"]).default("open"),
});

export const updateFlaggedApplicationSchema = z.object({
  status: z.enum(["open", "resolved"]).optional(),
  resolved_at: z.string().optional(),
  resolution_note: z.string().optional(),
});

export type InsertFlaggedApplication = z.infer<
  typeof insertFlaggedApplicationSchema
>;
export type UpdateFlaggedApplication = z.infer<
  typeof updateFlaggedApplicationSchema
>;

export function getClientFullName(client: Client): string {
  return `${client.first_name} ${client.last_name}`.trim();
}

// Applier Earnings - tracks base pay and bonuses
export type EarningsType =
  | "base_pay"
  | "application_milestone"
  | "interview_bonus"
  | "placement_bonus";
export type PaymentStatus = "pending" | "approved" | "paid";

export interface ApplierEarning {
  id: string;
  applier_id: string;
  client_id?: string;
  earnings_type: EarningsType;
  amount: number;
  application_count?: number;
  interview_id?: string;
  earned_date: string;
  pay_period_start?: string;
  pay_period_end?: string;
  payment_status: PaymentStatus;
  paid_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const insertApplierEarningSchema = z.object({
  applier_id: z.string().uuid(),
  client_id: z.string().uuid().optional(),
  earnings_type: z.enum([
    "base_pay",
    "application_milestone",
    "interview_bonus",
    "placement_bonus",
  ]),
  amount: z.number(),
  application_count: z.number().optional(),
  interview_id: z.string().uuid().optional(),
  earned_date: z.string().optional(),
  pay_period_start: z.string().optional(),
  pay_period_end: z.string().optional(),
  payment_status: z.enum(["pending", "approved", "paid"]).default("pending"),
  notes: z.string().optional(),
});

export type InsertApplierEarning = z.infer<typeof insertApplierEarningSchema>;

export const updateApplierEarningSchema = z.object({
  payment_status: z.enum(["pending", "approved", "paid"]).optional(),
  paid_date: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateApplierEarning = z.infer<typeof updateApplierEarningSchema>;

export function calculateClientStatus(client: Client): ClientStatus {
  if (client.placement_date) {
    return "placed";
  }

  const onboardingComplete =
    client.resume_approved &&
    client.cover_letter_approved &&
    client.job_criteria_signoff;

  if (onboardingComplete) {
    return "active";
  }

  const onboardingStarted =
    client.resume_approved ||
    client.cover_letter_approved ||
    client.job_criteria_signoff;

  if (onboardingStarted) {
    return "onboarding_in_progress";
  }

  return "onboarding_not_started";
}
