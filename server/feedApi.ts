/**
 * Feed API Client
 *
 * This module provides a wrapper around the cofounder's centralized job feed API.
 * All job queue operations now go through this API instead of local Supabase tables.
 *
 * Base URL: https://p01--jobindex-postgrest--54lkjbzvq5q4.code.run/rpc
 */

const FEED_API_BASE =
  "https://p01--jobindex-postgrest--54lkjbzvq5q4.code.run/rpc";

const FEED_AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicG9zdGdyZXN0X3JlYWRlciJ9.C2u4mxuXdaFb4ObhkQCNIjhb9oyeDzAQQ3Sw8mYVD14";

// ============================================================
// Types from cofounder's API
// ============================================================

/**
 * Job data point structure (nested inside FeedJob)
 */
export interface JobDataPoint {
  id: number;
  title: string;
  company: string;
  company_logo: string;
  job_location: string;
  source: string; // "LinkedIn", "Indeed", etc.
  source_url: string;
  apply_url: string;
  posted_day: string;
}

/**
 * AI filter match strength per user
 */
export interface AIFilterMatch {
  user_id: string;
  match_strength: "strong" | "moderate" | "weak" | "none";
}

/**
 * Job structure returned from the feed API
 */
export interface FeedJob {
  canonical_job_id: number;
  admin_note: string | null;
  job_data_points: JobDataPoint[];
  wilsons_ai_filter_by_user?: AIFilterMatch[];
  client_id?: string;
  applier_id?: string;
}

/**
 * Flagged job record from Feed API
 */
export interface FeedFlaggedJob {
  job_id: number;
  applier_id: string;
  client_id: string;
  flagged_at: string;
  comment: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  job_title: string;
  company_name: string;
  job_url: string;
  applier_name?: string;
  client_name?: string;
}

/**
 * Flattened job for UI display
 * This is what the queue.tsx component expects
 */
export interface DisplayJob {
  job_id: number;
  job_title: string;
  company_name: string;
  job_url: string;
  location: string | null;
  description: string | null;
  posted_date: string | null;
  salary_min: number | null;
  salary_max: number | null;
  job_type: string | null;
  remote: boolean | null;
  source: string | null;
  client_id: string;
  applier_id: string;
  match_strength: "strong" | "moderate" | "weak" | "none" | null;
}

// ============================================================
// API Functions
// ============================================================

/**
 * Get the job queue for an applier
 * Returns jobs assigned to this applier across all their clients
 */
export async function getApplierQueue(applierId: string): Promise<FeedJob[]> {
  try {
    const response = await fetch(`${FEED_API_BASE}/applier_jobs_queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FEED_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        applier: applierId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Feed API error: ${response.status} - ${errorText}`);
    }

    const jobs = await response.json();
    return jobs as FeedJob[];
  } catch (error) {
    console.error("[FeedAPI] Error fetching applier queue:", error);
    throw error;
  }
}

/**
 * Mark a job as applied
 * @param applierId - The applier who applied
 * @param jobId - The feed job ID (canonical_job_id)
 * @param status - 1 for applied, 0 for not applied
 * @param durationSeconds - How long the application took
 */
export async function setApplicationStatus(
  applierId: string,
  jobId: number,
  status: number,
  durationSeconds: number,
): Promise<void> {
  try {
    const response = await fetch(`${FEED_API_BASE}/set_application_status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FEED_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        p_applier_id: applierId,
        p_job_id: jobId,
        p_status: status,
        p_duration_seconds: durationSeconds,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Feed API error: ${response.status} - ${errorText}`);
    }

    console.log(
      `[FeedAPI] Marked job ${jobId} as applied for applier ${applierId}`,
    );
  } catch (error) {
    console.error("[FeedAPI] Error setting application status:", error);
    throw error;
  }
}

/**
 * Flag a job with a comment
 * @param applierId - The applier who flagged
 * @param jobId - The feed job ID (canonical_job_id)
 * @param comment - Reason for flagging
 */
export async function setJobFlag(
  applierId: string,
  jobId: number,
  comment: string,
): Promise<void> {
  try {
    const response = await fetch(`${FEED_API_BASE}/set_job_flag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FEED_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        p_applier_id: applierId,
        p_job_id: jobId,
        p_comment: comment,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Feed API error: ${response.status} - ${errorText}`);
    }

    console.log(`[FeedAPI] Flagged job ${jobId} by applier ${applierId}`);
  } catch (error) {
    console.error("[FeedAPI] Error flagging job:", error);
    throw error;
  }
}

/**
 * Resolve a flagged job
 * @param applierId - The applier whose flag we're resolving
 * @param jobId - The feed job ID (canonical_job_id)
 * @param resolvedBy - Who resolved it (admin user ID)
 * @param resolutionNote - Note explaining resolution
 */
export async function setJobFlagResolved(
  applierId: string,
  jobId: number,
  resolvedBy: string,
  resolutionNote: string,
): Promise<void> {
  try {
    const response = await fetch(`${FEED_API_BASE}/set_job_flag_resolved`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FEED_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        p_applier_id: applierId,
        p_job_id: jobId,
        p_resolved_by: resolvedBy,
        p_resolution_note: resolutionNote,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Feed API error: ${response.status} - ${errorText}`);
    }

    console.log(`[FeedAPI] Resolved flag for job ${jobId}`);
  } catch (error) {
    console.error("[FeedAPI] Error resolving flag:", error);
    throw error;
  }
}

/**
 * Get all flagged jobs for admin review
 * @param includeResolved - Whether to include resolved flags
 */
export async function getAdminFlaggedJobs(
  includeResolved = false,
): Promise<FeedFlaggedJob[]> {
  try {
    const response = await fetch(`${FEED_API_BASE}/admin_flagged_jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FEED_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        p_include_resolved: includeResolved,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Feed API error: ${response.status} - ${errorText}`);
    }

    const flags = await response.json();
    return flags as FeedFlaggedJob[];
  } catch (error) {
    console.error("[FeedAPI] Error fetching flagged jobs:", error);
    throw error;
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Convert FeedJob array to DisplayJob array for UI
 * Maps cofounder's nested structure to flat structure for queue.tsx
 * Filters out "none" (hard skip) jobs
 */
export function toDisplayJobs(
  feedJobs: FeedJob[],
  clientId?: string,
): DisplayJob[] {
  return feedJobs
    .map((job) => {
      // Get the first job_data_point (or empty object if none)
      const jobData = job.job_data_points?.[0] || ({} as JobDataPoint);

      // Find match strength for this client
      const aiFilter = job.wilsons_ai_filter_by_user?.find(
        (f) => f.user_id === (clientId || job.client_id),
      );
      const matchStrength = aiFilter?.match_strength || null;

      return {
        job_id: job.canonical_job_id,
        job_title: jobData.title || "Unknown Title",
        company_name: jobData.company || "Unknown Company",
        job_url: jobData.apply_url || jobData.source_url || "",
        location: jobData.job_location || null,
        description: null,
        posted_date: jobData.posted_day || null,
        salary_min: null,
        salary_max: null,
        job_type: null,
        remote: null,
        source: null,
        client_id: job.client_id || "",
        applier_id: job.applier_id || "",
        match_strength: matchStrength,
      };
    })
    .filter((job) => job.match_strength !== "none"); // Filter out hard skips
}

/**
 * Format salary range for display
 */
export function formatSalaryRange(
  min: number | null,
  max: number | null,
): string {
  if (!min && !max) return "";
  if (min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  }
  if (min) return `$${min.toLocaleString()}+`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return "";
}
