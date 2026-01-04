import { storage } from "./storage";

const FEED_API_URL = 'https://p01--jobindex-postgrest--54lkjbzvq5q4.code.run/rpc';
const FEED_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicG9zdGdyZXN0X3JlYWRlciJ9.C2u4mxuXdaFb4ObhkQCNIjhb9oyeDzAQQ3Sw8mYVD14';

interface FeedJob {
  canonical_job_id: number;
  title: string;
  company: string;
  company_logo: string;
  job_location: string;
  apply_url: string;
  cursor_time: string;
  cursor_id: number;
}

/**
 * Fetch jobs from the feed API for a specific client
 */
async function fetchJobsFromFeed(clientId: string, pageSize: number = 50): Promise<FeedJob[]> {
  const response = await fetch(`${FEED_API_URL}/jumpseat_user_job_feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FEED_AUTH_TOKEN}`
    },
    body: JSON.stringify({
      user: clientId,
      exclude_apply_domains: ['www.linkedin.com'],
      page_size: pageSize
    })
  });

  if (!response.ok) {
    throw new Error(`Feed API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mark a job as applied in the feed API
 */
export async function markJobAppliedInFeed(clientId: string, feedJobId: number): Promise<void> {
  const response = await fetch(`${FEED_API_URL}/register_jumpseat_user_job_application`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FEED_AUTH_TOKEN}`
    },
    body: JSON.stringify({
      user: clientId,
      job: feedJobId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to mark job as applied in feed: ${response.statusText}`);
  }
}

/**
 * Sync jobs from feed API to database for a specific client
 * Returns the number of new jobs added
 */
export async function syncJobsForClient(clientId: string): Promise<{ added: number; skipped: number; errors: string[] }> {
  const stats = { added: 0, skipped: 0, errors: [] as string[] };

  try {
    // Fetch jobs from feed
    const feedJobs = await fetchJobsFromFeed(clientId);

    console.log(`[Job Sync] Fetched ${feedJobs.length} jobs from feed for client ${clientId}`);

    // Process each job
    for (const feedJob of feedJobs) {
      try {
        // Check if job already exists in database
        const existingJob = await storage.getJobByFeedId(feedJob.canonical_job_id);

        if (existingJob) {
          stats.skipped++;
          continue;
        }

        // Insert new job into database
        await storage.createJob({
          client_id: clientId,
          feed_job_id: feedJob.canonical_job_id,
          feed_source: 'feed',
          job_title: feedJob.title,
          company_name: feedJob.company,
          job_url: feedJob.apply_url,
          job_location: feedJob.job_location,
          scraped_at: new Date().toISOString(),
          board_source: 'job_feed_api',
        });

        stats.added++;
      } catch (error) {
        stats.errors.push(`Failed to process job ${feedJob.canonical_job_id}: ${error}`);
        console.error(`[Job Sync] Error processing job ${feedJob.canonical_job_id}:`, error);
      }
    }

    console.log(`[Job Sync] Complete for client ${clientId}. Added: ${stats.added}, Skipped: ${stats.skipped}, Errors: ${stats.errors.length}`);

    return stats;
  } catch (error) {
    console.error(`[Job Sync] Fatal error syncing jobs for client ${clientId}:`, error);
    throw error;
  }
}

/**
 * Sync jobs for all active clients
 */
export async function syncJobsForAllClients(): Promise<{ [clientId: string]: { added: number; skipped: number; errors: string[] } }> {
  try {
    const clients = await storage.getClients();
    const activeClients = clients.filter(c => c.status === 'active' || c.status === 'placed');

    console.log(`[Job Sync] Starting sync for ${activeClients.length} active clients`);

    const results: { [clientId: string]: { added: number; skipped: number; errors: string[] } } = {};

    for (const client of activeClients) {
      try {
        results[client.id] = await syncJobsForClient(client.id);
      } catch (error) {
        results[client.id] = {
          added: 0,
          skipped: 0,
          errors: [`Fatal error: ${error}`]
        };
      }
    }

    return results;
  } catch (error) {
    console.error(`[Job Sync] Fatal error syncing all clients:`, error);
    throw error;
  }
}