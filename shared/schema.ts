import { z } from "zod";

export type UserRole = "Admin" | "Client" | "Applier";

export type ClientStatus = "onboarding_not_started" | "onboarding_in_progress" | "active" | "paused" | "placed";

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

export interface Applier {
  id: string;
  name: string;
  email: string;
  username: string;
  created_at?: string;
}

export interface Job {
  id: string;
  role: string;
  company: string;
  location: string;
  posted_time?: string;
  match_score?: number;
  description?: string;
  client_id: string;
  requirements?: string[];
}

export interface Application {
  id: string;
  job_id: string;
  applier_id: string;
  client_id: string;
  status: "Pending" | "Applied" | "Interview" | "Offer" | "Rejected";
  qa_status: "None" | "Approved" | "Rejected";
  applied_date?: string;
  flagged_issue?: string;
}

export interface Interview {
  id: string;
  client_id: string;
  company: string;
  role: string;
  date: string;
  format: "Video" | "Panel" | "Phone" | "In-Person";
  prep_doc_complete: boolean;
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
export type DocumentType = "resume_original" | "resume_improved" | "cover_letter_original" | "cover_letter_A" | "cover_letter_B" | "cover_letter_C" | "linkedin_original" | "linkedin_improved";

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
  status: z.enum(["onboarding_not_started", "onboarding_in_progress", "active", "paused", "placed"]).default("onboarding_not_started"),
  resume_approved: z.boolean().default(false),
  cover_letter_approved: z.boolean().default(false),
  job_criteria_signoff: z.boolean().default(false),
});

export const updateClientSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  status: z.enum(["onboarding_not_started", "onboarding_in_progress", "active", "paused", "placed"]).optional(),
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
  document_feedback: z.object({
    resume: z.object({ text: z.string(), status: z.enum(["requested", "completed"]).nullable() }),
    "cover-letter": z.object({ text: z.string(), status: z.enum(["requested", "completed"]).nullable() }),
    linkedin: z.object({ text: z.string(), status: z.enum(["requested", "completed"]).nullable() }),
  }).optional(),
});

export const insertApplicationSchema = z.object({
  job_id: z.string(),
  applier_id: z.string(),
  client_id: z.string(),
  status: z.enum(["Pending", "Applied", "Interview", "Offer", "Rejected"]),
  qa_status: z.enum(["None", "Approved", "Rejected"]).default("None"),
  applied_date: z.string(),
  flagged_issue: z.string().optional(),
});

export const insertInterviewSchema = z.object({
  client_id: z.string(),
  company: z.string(),
  role: z.string(),
  date: z.string(),
  format: z.enum(["Video", "Panel", "Phone", "In-Person"]),
  prep_doc_complete: z.boolean().default(false),
});

export const insertClientDocumentSchema = z.object({
  client_id: z.string().uuid(),
  document_type: z.enum(["resume_original", "resume_improved", "cover_letter_original", "cover_letter_A", "cover_letter_B", "cover_letter_C", "linkedin_original", "linkedin_improved"]),
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

export type InsertJobCriteriaSample = z.infer<typeof insertJobCriteriaSampleSchema>;
export type UpdateJobCriteriaSample = z.infer<typeof updateJobCriteriaSampleSchema>;
export type InsertClientJobResponse = z.infer<typeof insertClientJobResponseSchema>;

export type InsertClient = z.input<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type InsertClientDocument = z.infer<typeof insertClientDocumentSchema>;

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
  status: z.enum(["pending", "in_progress", "applied", "flagged"]).default("pending"),
});

export const updateApplierJobSessionSchema = z.object({
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  duration_seconds: z.number().optional(),
  status: z.enum(["pending", "in_progress", "applied", "flagged"]).optional(),
  flag_comment: z.string().optional(),
});

export type InsertApplierJobSession = z.infer<typeof insertApplierJobSessionSchema>;
export type UpdateApplierJobSession = z.infer<typeof updateApplierJobSessionSchema>;

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

export type InsertFlaggedApplication = z.infer<typeof insertFlaggedApplicationSchema>;
export type UpdateFlaggedApplication = z.infer<typeof updateFlaggedApplicationSchema>;

export function getClientFullName(client: Client): string {
  return `${client.first_name} ${client.last_name}`.trim();
}

export function calculateClientStatus(client: Client): ClientStatus {
  if (client.placement_date) {
    return "placed";
  }
  
  const onboardingComplete = client.resume_approved && client.cover_letter_approved && client.job_criteria_signoff;
  
  if (onboardingComplete) {
    return "active";
  }
  
  const onboardingStarted = client.resume_approved || client.cover_letter_approved || client.job_criteria_signoff;
  
  if (onboardingStarted) {
    return "onboarding_in_progress";
  }
  
  return "onboarding_not_started";
}
