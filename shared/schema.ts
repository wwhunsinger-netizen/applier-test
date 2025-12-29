import { z } from "zod";

export type UserRole = "Admin" | "Client" | "Applier";

export type ClientStatus = "onboarding_not_started" | "onboarding_in_progress" | "active" | "paused" | "placed";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
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
  seniority_level?: string;
  onboarding_transcript?: string;
  daily_application_target?: number;
  first_application_date?: string;
  last_application_date?: string;
  placement_date?: string;
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

// Minimal insert schema - only fields required to create a client
// Additional fields can be added via update after creation
export const insertClientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
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
  seniority_level: z.string().optional(),
  onboarding_transcript: z.string().optional(),
  daily_application_target: z.number().optional(),
  placement_date: z.string().optional(),
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

export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

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
