/**
 * One-time backfill script to populate linkedin_url and source
 * for existing applications from the Feed API.
 *
 * Run with: npx ts-node backfill-linkedin-urls.ts
 * Or: npx tsx backfill-linkedin-urls.ts
 */

import { createClient } from "@supabase/supabase-js";

// Your Supabase credentials
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://qpvgjsuqsyrkfaghcdks.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdmdqc3Vxc3lya2ZhZ2hjZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUyMDI5MCwiZXhwIjoyMDgyMDk2MjkwfQ.6PFBVK9zxUR3VgZMEFoc6rcB7eNDB6Xmvu2mwNeUCL8";

// Cofounder's Feed API
const FEED_API_BASE =
  "https://p01--jobindex-postgrest--54lkjbzvq5q4.code.run/rpc";
const FEED_AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicG9zdGdyZXN0X3JlYWRlciJ9.C2u4mxuXdaFb4ObhkQCNIjhb9oyeDzAQQ3Sw8mYVD14";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Application {
  id: string;
  feed_job_id: number;
  linkedin_url: string | null;
  source: string | null;
}

interface JobDataPoint {
  source: string;
  source_url: string;
}

interface FeedJob {
  canonical_job_id: number;
  job_data_points: JobDataPoint[];
}

async function fetchJobFromFeed(jobId: number): Promise<FeedJob | null> {
  // Note: We'll need to use a different approach since there's no single-job endpoint
  // For now, we'll collect all unique job IDs and batch them
  return null;
}

async function main() {
  console.log("🚀 Starting backfill of linkedin_url and source...\n");

  // 1. Get all applications that have feed_job_id but no linkedin_url
  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, feed_job_id, linkedin_url, source, applier_id")
    .not("feed_job_id", "is", null)
    .is("linkedin_url", null);

  if (error) {
    console.error("❌ Error fetching applications:", error);
    return;
  }

  console.log(
    `📋 Found ${applications?.length || 0} applications to backfill\n`,
  );

  if (!applications || applications.length === 0) {
    console.log("✅ Nothing to backfill!");
    return;
  }

  // 2. Get unique applier IDs to fetch their job queues
  const applierIds = Array.from(
    new Set(applications.map((a) => a.applier_id).filter(Boolean)),
  );
  console.log(`👥 Found ${applierIds.length} unique appliers\n`);

  // 3. For each applier, fetch their applied jobs from the Feed API
  const jobDataMap = new Map<
    number,
    { linkedin_url: string | null; source: string | null }
  >();

  for (const applierId of applierIds) {
    console.log(`📡 Fetching jobs for applier ${applierId}...`);

    try {
      const response = await fetch(`${FEED_API_BASE}/applied_jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FEED_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ applier: applierId }),
      });

      if (!response.ok) {
        console.error(
          `   ❌ Failed to fetch for ${applierId}: ${response.status}`,
        );
        continue;
      }

      const jobs: FeedJob[] = await response.json();
      console.log(`   ✅ Got ${jobs.length} jobs`);

      // Extract linkedin_url and source for each job
      for (const job of jobs) {
        const jobData = job.job_data_points?.[0];
        if (jobData) {
          const isLinkedIn = jobData.source?.toLowerCase() === "linkedin";
          jobDataMap.set(job.canonical_job_id, {
            linkedin_url: isLinkedIn ? jobData.source_url : null,
            source: jobData.source || null,
          });
        }
      }
    } catch (err) {
      console.error(`   ❌ Error fetching for ${applierId}:`, err);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n📦 Collected data for ${jobDataMap.size} jobs\n`);

  // 4. Update applications with the collected data
  let updated = 0;
  let skipped = 0;

  for (const app of applications) {
    const jobData = jobDataMap.get(app.feed_job_id);

    if (!jobData) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        linkedin_url: jobData.linkedin_url,
        source: jobData.source,
      })
      .eq("id", app.id);

    if (updateError) {
      console.error(`❌ Failed to update ${app.id}:`, updateError);
    } else {
      updated++;
      if (jobData.linkedin_url) {
        console.log(`✅ Updated ${app.id} with LinkedIn URL`);
      }
    }
  }

  console.log(`\n🎉 Backfill complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped (no data found): ${skipped}`);
}

main().catch(console.error);
