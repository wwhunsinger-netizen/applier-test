import type { Client, Application, Interview, Job, Applier, InsertClient, UpdateClient, InsertApplication, InsertInterview } from "@shared/schema";

const API_BASE = "/api";

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
