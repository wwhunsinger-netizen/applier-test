const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

interface ApifyIndeedJobData {
  positionName?: string;
  company?: string;
  location?: string;
  salary?: string;
  jobType?: string[] | string;
  description?: string;
  descriptionHTML?: string;
  url?: string;
  rating?: number;
  postedAt?: string;
  isExpired?: boolean;
}

export interface ScrapedJobData {
  title?: string;
  company_name?: string;
  location?: string;
  is_remote?: boolean;
  job_type?: string;
  description?: string;
  required_skills?: string[];
  experience_level?: string;
  apply_url?: string;
  salary_min?: number;
  salary_max?: number;
  company_logo_url?: string;
  raw_data?: Record<string, unknown>;
}

function parseSalaryRange(salary?: string): { min?: number; max?: number } {
  if (!salary) return {};
  
  const numbers = salary.match(/[\d,]+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return {};
  
  const parsed = numbers.map(n => parseFloat(n.replace(/,/g, '')));
  
  if (parsed.length >= 2) {
    return { min: Math.min(...parsed), max: Math.max(...parsed) };
  }
  return { min: parsed[0] };
}

function normalizeJobData(data: ApifyIndeedJobData): ScrapedJobData {
  const salaryRange = parseSalaryRange(data.salary);
  const locationLower = (data.location || '').toLowerCase();
  const isRemote = locationLower.includes('remote') || locationLower.includes('work from home');
  
  const jobType = Array.isArray(data.jobType) ? data.jobType.join(', ') : data.jobType;
  
  return {
    title: data.positionName,
    company_name: data.company,
    location: data.location,
    is_remote: isRemote,
    job_type: jobType,
    description: data.description || data.descriptionHTML,
    apply_url: data.url,
    salary_min: salaryRange.min,
    salary_max: salaryRange.max,
    raw_data: data as Record<string, unknown>,
  };
}

export async function scrapeJobUrl(url: string): Promise<ScrapedJobData | null> {
  if (!APIFY_API_TOKEN) {
    console.error("APIFY_API_TOKEN not configured");
    return null;
  }

  console.log(`[Apify] Starting scrape for URL: ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(
      `https://api.apify.com/v2/acts/misceres~indeed-scraper/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxItems: 1,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    console.log(`[Apify] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Apify] API error: ${response.status} ${response.statusText} - ${errorText}`);
      return null;
    }

    const results = await response.json() as ApifyIndeedJobData[];
    console.log(`[Apify] Got ${results?.length || 0} results`);
    
    if (!results || results.length === 0) {
      console.log("[Apify] No results returned for URL:", url);
      return null;
    }

    console.log(`[Apify] Successfully scraped: ${results[0].positionName} at ${results[0].company}`);
    return normalizeJobData(results[0]);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[Apify] Request timed out after 120 seconds for URL: ${url}`);
    } else {
      console.error("[Apify] Error scraping job URL:", error);
    }
    return null;
  }
}

export async function scrapeJobUrls(urls: string[]): Promise<Map<string, ScrapedJobData | null>> {
  const results = new Map<string, ScrapedJobData | null>();
  
  for (const url of urls) {
    const data = await scrapeJobUrl(url);
    results.set(url, data);
  }
  
  return results;
}
