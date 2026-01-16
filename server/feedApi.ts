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

// ============================================================
// Types from cofounder's API
// ============================================================

/**
 * Job structure returned from the feed API
 */
export interface FeedJob {
  job_id: number;
  title: string;
  company: string;
  location: string | null;
  apply_url: string;
  description: string | null;
  posted_date: string | null;
  salary_min: number | null;
  salary_max: number | null;
  job_type: string | null; // "Full-time", "Contract", etc.
  remote: boolean | null;
  source: string | null; // "LinkedIn", "Indeed", etc.
  // Jumpseat-specific fields set by cofounder's system
  client_id?: string;
  applier_id?: string;
}

/**
 * Applied job record from Feed API
 */
export interface FeedAppliedJob {
  job_id: number;
  applier_id: string;
  client_id: string;
  applied_at: string;
  duration_seconds: number;
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
  // Denormalized job info for display
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
  // Core identifiers
  job_id: number; // Feed's job ID (primary key now)

  // Job details
  job_title: string;
  company_name: string;
  job_url: string;
  location: string | null;
  apply_url: string;
  description: string | null;
  posted_date: string | null;

  // Salary info
  salary_min: number | null;
  salary_max: number | null;

  // Job metadata
  job_type: string | null;
  remote: boolean | null;
  source: string | null;

  // Assignment info (for applier context)
  client_id: string;
  applier_id: string;
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
 * @param jobId - The feed job ID
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
 * @param jobId - The feed job ID
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
 * @param jobId - The feed job ID
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
 * Flattens the structure for easier consumption by React components
 */
export function toDisplayJobs(feedJobs: FeedJob[]): DisplayJob[] {
  return feedJobs.map((job) => ({
    job_id: job.job_id,
    job_title: job.title,
    company_name: job.company,
    location: job.location,
    job_url: job.apply_url,
    description: job.description,
    posted_date: job.posted_date,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    job_type: job.job_type,
    remote: job.remote,
    source: job.source,
    client_id: job.client_id || "",
    applier_id: job.applier_id || "",
  }));
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
