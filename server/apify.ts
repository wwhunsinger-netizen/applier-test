const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

interface ApifyIndeedJobData {
  jobTitle?: string;
  company?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  employmentType?: string;
  description?: {
    text?: string;
    html?: string;
  };
  url?: string;
  thirdPartyApplyUrl?: string;
  companyRating?: number;
  companyBrandingAttributes?: {
    logoUrl?: string;
    headerImageUrl?: string;
  };
  datePosted?: string;
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
  
  return {
    title: data.jobTitle,
    company_name: data.company,
    location: data.location,
    is_remote: isRemote,
    job_type: data.jobType || data.employmentType,
    description: data.description?.text || data.description?.html,
    apply_url: data.url || data.thirdPartyApplyUrl,
    salary_min: salaryRange.min,
    salary_max: salaryRange.max,
    company_logo_url: data.companyBrandingAttributes?.logoUrl,
    raw_data: data as Record<string, unknown>,
  };
}

export async function scrapeJobUrl(url: string): Promise<ScrapedJobData | null> {
  if (!APIFY_API_TOKEN) {
    console.error("APIFY_API_TOKEN not configured");
    return null;
  }

  try {
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
      }
    );

    if (!response.ok) {
      console.error(`Apify API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const results = await response.json() as ApifyIndeedJobData[];
    
    if (!results || results.length === 0) {
      console.log("No results from Apify for URL:", url);
      return null;
    }

    return normalizeJobData(results[0]);
  } catch (error) {
    console.error("Error scraping job URL:", error);
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
