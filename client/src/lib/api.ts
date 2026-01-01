import type { Client, Application, Interview, Job, Applier, InsertClient, UpdateClient, InsertApplier, UpdateApplier, InsertApplication, InsertInterview, ClientDocument, InsertClientDocument, JobCriteriaSample, ClientJobResponse, InsertClientJobResponse, ApplierJobSession, FlaggedApplication } from "@shared/schema";

const API_BASE = "/api";

// Applier Stats type
export interface ApplierStats {
  dailyApps: number;
  dailyGoal: number;
  timeWorked: string;
  avgTimePerApp: string;
  projectedFinish: string;
  weeklyApps: number;
  weeklyEarnings: number;
  dailyEarnings: number;
  estimatedBasePay: number;
  interviewRate: number;
  qaErrorRate: number;
  jobsWaiting: number;
  totalApps: number;
}

// Fetch applier dashboard stats
export async function fetchApplierStats(applierId: string): Promise<ApplierStats> {
  const res = await fetch(`${API_BASE}/applier-stats/${applierId}`);
  if (!res.ok) throw new Error("Failed to fetch applier stats");
  return res.json();
}

// Document upload - get presigned URL
export async function requestUploadUrl(file: { name: string; size: number; type: string }) {
  const res = await fetch(`${API_BASE}/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type,
    }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  return res.json() as Promise<{ uploadURL: string; objectPath: string }>;
}

// Upload file to presigned URL
export async function uploadToPresignedUrl(file: File, uploadURL: string) {
  const res = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error("Failed to upload file");
}

// Client documents API
export async function fetchClientDocuments(clientId: string): Promise<ClientDocument[]> {
  const res = await fetch(`${API_BASE}/clients/${clientId}/documents`);
  if (!res.ok) throw new Error("Failed to fetch client documents");
  return res.json();
}

export async function saveClientDocument(
  clientId: string, 
  document: Omit<InsertClientDocument, 'client_id'>
): Promise<ClientDocument> {
  const res = await fetch(`${API_BASE}/clients/${clientId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(document),
  });
  if (!res.ok) throw new Error("Failed to save client document");
  return res.json();
}

export async function deleteClientDocument(clientId: string, documentType: string): Promise<void> {
  const res = await fetch(`${API_BASE}/clients/${clientId}/documents/${documentType}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete client document");
}

// Client API
export async function fetchClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/clients`);
  if (!res.ok) throw new Error("Failed to fetch clients");
  return res.json();
}

export async function fetchClient(id: string): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}`);
  if (!res.ok) throw new Error("Failed to fetch client");
  return res.json();
}

export async function createClient(client: InsertClient): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(client),
  });
  if (!res.ok) throw new Error("Failed to create client");
  return res.json();
}

export async function updateClient(id: string, updates: UpdateClient): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update client");
  return res.json();
}

// Applier API
export async function fetchAppliers(): Promise<Applier[]> {
  const res = await fetch(`${API_BASE}/appliers`);
  if (!res.ok) throw new Error("Failed to fetch appliers");
  return res.json();
}

export async function fetchApplier(id: string): Promise<Applier> {
  const res = await fetch(`${API_BASE}/appliers/${id}`);
  if (!res.ok) throw new Error("Failed to fetch applier");
  return res.json();
}

export async function createApplier(applier: InsertApplier): Promise<Applier> {
  const res = await fetch(`${API_BASE}/appliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(applier),
  });
  if (!res.ok) throw new Error("Failed to create applier");
  return res.json();
}

export async function updateApplier(id: string, updates: UpdateApplier): Promise<Applier> {
  const res = await fetch(`${API_BASE}/appliers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update applier");
  return res.json();
}

// Application API
export async function fetchApplications(params?: { client_id?: string; applier_id?: string }): Promise<Application[]> {
  const queryParams = new URLSearchParams();
  if (params?.client_id) queryParams.set("client_id", params.client_id);
  if (params?.applier_id) queryParams.set("applier_id", params.applier_id);
  
  const url = queryParams.toString() 
    ? `${API_BASE}/applications?${queryParams}`
    : `${API_BASE}/applications`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
}

export async function createApplication(application: InsertApplication): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(application),
  });
  if (!res.ok) throw new Error("Failed to create application");
  return res.json();
}

// Interview API
export async function fetchInterviews(params?: { client_id?: string }): Promise<Interview[]> {
  const queryParams = new URLSearchParams();
  if (params?.client_id) queryParams.set("client_id", params.client_id);
  
  const url = queryParams.toString() 
    ? `${API_BASE}/interviews?${queryParams}`
    : `${API_BASE}/interviews`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch interviews");
  return res.json();
}

export async function createInterview(interview: InsertInterview): Promise<Interview> {
  const res = await fetch(`${API_BASE}/interviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(interview),
  });
  if (!res.ok) throw new Error("Failed to create interview");
  return res.json();
}

// Job API
export async function fetchJobs(params?: { client_id?: string }): Promise<Job[]> {
  const queryParams = new URLSearchParams();
  if (params?.client_id) queryParams.set("client_id", params.client_id);
  
  const url = queryParams.toString() 
    ? `${API_BASE}/jobs?${queryParams}`
    : `${API_BASE}/jobs`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function fetchQueueJobs(clientId: string, applierId: string): Promise<Job[]> {
  const queryParams = new URLSearchParams();
  queryParams.set("client_id", clientId);
  queryParams.set("applier_id", applierId);
  
  const res = await fetch(`${API_BASE}/queue-jobs?${queryParams}`);
  if (!res.ok) throw new Error("Failed to fetch queue jobs");
  return res.json();
}

// Job Sample API
export async function fetchJobSamples(clientId: string): Promise<JobCriteriaSample[]> {
  const res = await fetch(`${API_BASE}/clients/${clientId}/job-samples`);
  if (!res.ok) throw new Error("Failed to fetch job samples");
  return res.json();
}

export async function createJobSamplesBulk(clientId: string, urls: string[]): Promise<JobCriteriaSample[]> {
  const res = await fetch(`${API_BASE}/clients/${clientId}/job-samples/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!res.ok) throw new Error("Failed to create job samples");
  return res.json();
}

export async function updateJobSample(id: string, updates: Partial<JobCriteriaSample>): Promise<JobCriteriaSample> {
  const res = await fetch(`${API_BASE}/job-samples/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update job sample");
  return res.json();
}

export async function deleteJobSample(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/job-samples/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete job sample");
}

export async function scrapeJobSample(id: string): Promise<JobCriteriaSample> {
  const res = await fetch(`${API_BASE}/job-samples/${id}/scrape`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to scrape job sample");
  return res.json();
}

// Client Job Response API
export async function fetchJobResponses(clientId: string): Promise<ClientJobResponse[]> {
  const res = await fetch(`${API_BASE}/clients/${clientId}/job-responses`);
  if (!res.ok) throw new Error("Failed to fetch job responses");
  return res.json();
}

export async function createJobResponse(clientId: string, response: Omit<InsertClientJobResponse, 'client_id'>): Promise<ClientJobResponse> {
  const res = await fetch(`${API_BASE}/clients/${clientId}/job-responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  });
  if (!res.ok) throw new Error("Failed to create job response");
  return res.json();
}

// Applier Session API
export async function fetchApplierSessions(applierId: string): Promise<ApplierJobSession[]> {
  const res = await fetch(`${API_BASE}/applier-sessions?applier_id=${applierId}`);
  if (!res.ok) throw new Error("Failed to fetch applier sessions");
  return res.json();
}

export async function startReviewSession(data: {
  job_id: string;
  applier_id: string;
}): Promise<ApplierJobSession> {
  const res = await fetch(`${API_BASE}/applier-sessions/start-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to start review session");
  return res.json();
}

export async function markSessionApplied(sessionId: string): Promise<{ session: ApplierJobSession; application: Application }> {
  const res = await fetch(`${API_BASE}/applier-sessions/${sessionId}/applied`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to mark as applied");
  return res.json();
}

export async function flagSession(sessionId: string, comment: string): Promise<{ session: ApplierJobSession; flaggedApplication: FlaggedApplication }> {
  const res = await fetch(`${API_BASE}/applier-sessions/${sessionId}/flag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) throw new Error("Failed to flag job");
  return res.json();
}

// Flagged Applications API (Admin)
export async function fetchFlaggedApplications(status?: "open" | "resolved"): Promise<FlaggedApplication[]> {
  const url = status 
    ? `${API_BASE}/flagged-applications?status=${status}`
    : `${API_BASE}/flagged-applications`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch flagged applications");
  return res.json();
}

export async function resolveFlaggedApplication(id: string, data: { resolved_by: string; resolution_note?: string }): Promise<FlaggedApplication> {
  const res = await fetch(`${API_BASE}/flagged-applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "resolved", ...data }),
  });
  if (!res.ok) throw new Error("Failed to resolve flagged application");
  return res.json();
}

// Admin Client Costs API
export interface ClientCost {
  client_id: string;
  client_name: string;
  total_cost: number;
  paid_amount: number;
  pending_amount: number;
  earnings_breakdown: {
    application_milestone: number;
    interview_bonus: number;
    placement_bonus: number;
  };
}

export async function fetchClientCosts(): Promise<ClientCost[]> {
  const res = await fetch(`${API_BASE}/admin/client-costs`);
  if (!res.ok) throw new Error("Failed to fetch client costs");
  return res.json();
}

// Admin Overview API
export interface ApplierPerformance {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Idle" | "Inactive" | "Offline";
  lastActive: string;
  dailyApps: number;
  dailyGoal: number;
  weeklyApps: number;
  weeklyGoal: number;
  qaScore: number;
  interviewRate: number;
  totalApps: number;
}

export interface AdminOverview {
  summary: {
    totalDailyApps: number;
    totalWeeklyApps: number;
    activeReviewers: number;
    totalAppliers: number;
    avgQaScore: number;
  };
  appliers: ApplierPerformance[];
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const res = await fetch(`${API_BASE}/admin/overview`);
  if (!res.ok) throw new Error("Failed to fetch admin overview");
  return res.json();
}

// Admin Client Performance API
export interface ClientPerformance {
  id: string;
  name: string;
  status: string;
  startDate: string;
  lastActivity: string;
  totalApps: number;
  interviews: number;
  offers: number;
  spend: number;
}

export async function fetchClientPerformance(): Promise<ClientPerformance[]> {
  const res = await fetch(`${API_BASE}/admin/client-performance`);
  if (!res.ok) throw new Error("Failed to fetch client performance");
  return res.json();
}
