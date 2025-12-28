import { z } from "zod";

export type UserRole = "Admin" | "Client" | "Applier";

export interface Client {
  id: string;
  name: string;
  email: string;
  username: string;
  created_at?: string;
  updated_at?: string;
  status: "active" | "action_needed";
  comments_count?: number;
  applications_sent?: number;
  interviews_scheduled?: number;
  job_criteria_signoff: boolean;
  resume_approved: boolean;
  cover_letter_approved: boolean;
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

export const insertClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
  status: z.enum(["active", "action_needed"]).default("active"),
  applications_sent: z.number().default(0),
  interviews_scheduled: z.number().default(0),
  job_criteria_signoff: z.boolean().default(false),
  resume_approved: z.boolean().default(false),
  cover_letter_approved: z.boolean().default(false),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "action_needed"]).optional(),
  applications_sent: z.number().optional(),
  interviews_scheduled: z.number().optional(),
  job_criteria_signoff: z.boolean().optional(),
  resume_approved: z.boolean().optional(),
  cover_letter_approved: z.boolean().optional(),
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
