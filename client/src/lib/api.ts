import type { Client, Application, Interview, Job, Applier, InsertClient, UpdateClient, InsertApplication, InsertInterview, ClientDocument, InsertClientDocument, JobCriteriaSample, ClientJobResponse, InsertClientJobResponse, ApplierJobSession, FlaggedApplication } from "@shared/schema";

const API_BASE = "/api";

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
  client_id: string;
  job_url: string;
  job_title?: string;
  company_name?: string;
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
