const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

interface ApifyJobData {
  title?: string;
  company?: string;
  companyName?: string;
  location?: string;
  isRemote?: boolean;
  remote?: boolean;
  jobType?: string;
  employmentType?: string;
  description?: string;
  descriptionText?: string;
  skills?: string[];
  experienceLevel?: string;
  seniorityLevel?: string;
  applyUrl?: string;
  applyLink?: string;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string;
  companyLogo?: string;
  companyLogoUrl?: string;
  url?: string;
  link?: string;
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

function normalizeJobData(data: ApifyJobData): ScrapedJobData {
  return {
    title: data.title,
    company_name: data.company || data.companyName,
    location: data.location,
    is_remote: data.isRemote ?? data.remote,
    job_type: data.jobType || data.employmentType,
    description: data.description || data.descriptionText,
    required_skills: data.skills,
    experience_level: data.experienceLevel || data.seniorityLevel,
    apply_url: data.applyUrl || data.applyLink || data.url || data.link,
    salary_min: data.salaryMin,
    salary_max: data.salaryMax,
    company_logo_url: data.companyLogo || data.companyLogoUrl,
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
      `https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
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

    const results = await response.json() as ApifyJobData[];
    
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
