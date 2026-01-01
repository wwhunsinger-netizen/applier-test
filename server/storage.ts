import type { Client, Application, Interview, Job, Applier, InsertClient, UpdateClient, InsertApplier, UpdateApplier, InsertApplication, InsertInterview, ClientDocument, InsertClientDocument, JobCriteriaSample, InsertJobCriteriaSample, UpdateJobCriteriaSample, ClientJobResponse, InsertClientJobResponse, ApplierJobSession, InsertApplierJobSession, UpdateApplierJobSession, FlaggedApplication, InsertFlaggedApplication, UpdateFlaggedApplication, ApplierEarning, InsertApplierEarning, UpdateApplierEarning } from "@shared/schema";
import { supabase } from "./supabase";

export interface IStorage {
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: UpdateClient): Promise<Client | null>;
  
  // Application operations
  getApplications(): Promise<Application[]>;
  getApplicationsByClient(clientId: string): Promise<Application[]>;
  getApplicationsByApplier(applierId: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application | null>;
  
  // Interview operations
  getInterviews(): Promise<Interview[]>;
  getInterviewsByClient(clientId: string): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  
  // Job operations
  getJobs(): Promise<Job[]>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  getQueueJobs(clientId: string, applierId: string): Promise<Job[]>;
  
  // Applier operations
  getAppliers(): Promise<Applier[]>;
  getApplier(id: string): Promise<Applier | null>;
  createApplier(applier: InsertApplier): Promise<Applier>;
  updateApplier(id: string, updates: UpdateApplier): Promise<Applier | null>;
  
  // Client document operations
  getClientDocuments(clientId: string): Promise<ClientDocument[]>;
  createClientDocument(document: InsertClientDocument): Promise<ClientDocument>;
  deleteClientDocument(clientId: string, documentType: string): Promise<void>;
  
  // Job criteria sample operations
  getJobSamples(clientId: string): Promise<JobCriteriaSample[]>;
  getJobSampleById(id: string): Promise<JobCriteriaSample | null>;
  createJobSample(sample: InsertJobCriteriaSample): Promise<JobCriteriaSample>;
  updateJobSample(id: string, updates: UpdateJobCriteriaSample): Promise<JobCriteriaSample | null>;
  deleteJobSample(id: string): Promise<void>;
  
  // Client job response operations
  getJobResponses(clientId: string): Promise<ClientJobResponse[]>;
  createJobResponse(response: InsertClientJobResponse): Promise<ClientJobResponse>;
  
  // Applier job session operations (job details come from JOIN with jobs table)
  getApplierSessions(applierId: string): Promise<ApplierJobSession[]>;
  getApplierSession(id: string): Promise<ApplierJobSession | null>;
  getApplierSessionByJob(jobId: string, applierId: string): Promise<ApplierJobSession | null>;
  createApplierSession(session: InsertApplierJobSession): Promise<ApplierJobSession>;
  updateApplierSession(id: string, updates: UpdateApplierJobSession): Promise<ApplierJobSession | null>;
  
  // Flagged application operations
  getFlaggedApplications(): Promise<FlaggedApplication[]>;
  getFlaggedApplicationsByStatus(status: "open" | "resolved"): Promise<FlaggedApplication[]>;
  createFlaggedApplication(flagged: InsertFlaggedApplication): Promise<FlaggedApplication>;
  updateFlaggedApplication(id: string, updates: UpdateFlaggedApplication): Promise<FlaggedApplication | null>;
  
  // Applier earnings operations
  getApplierEarnings(applierId: string): Promise<ApplierEarning[]>;
  getApplierEarningsByDateRange(applierId: string, startDate: string, endDate: string): Promise<ApplierEarning[]>;
  createApplierEarning(earning: InsertApplierEarning): Promise<ApplierEarning>;
  updateApplierEarning(id: string, updates: UpdateApplierEarning): Promise<ApplierEarning | null>;
  getEarningsByClient(clientId: string): Promise<ApplierEarning[]>;
  getAllEarnings(): Promise<ApplierEarning[]>;
}

export class SupabaseStorage implements IStorage {
  // Client operations
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getClient(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateClient(id: string, updates: UpdateClient): Promise<Client | null> {
    // Clean up empty strings to null for fields with unique constraints
    // Using Record type to allow null values for Supabase
    const cleanedUpdates: Record<string, unknown> = { ...updates };
    if (cleanedUpdates.client_gmail === '') {
      cleanedUpdates.client_gmail = null;
    }
    if (cleanedUpdates.email === '') {
      cleanedUpdates.email = null;
    }
    // Convert empty arrays to null for optional array fields
    if (Array.isArray(cleanedUpdates.target_job_titles) && (cleanedUpdates.target_job_titles as string[]).length === 0) {
      cleanedUpdates.target_job_titles = null;
    }
    if (Array.isArray(cleanedUpdates.required_skills) && (cleanedUpdates.required_skills as string[]).length === 0) {
      cleanedUpdates.required_skills = null;
    }
    if (Array.isArray(cleanedUpdates.nice_to_have_skills) && (cleanedUpdates.nice_to_have_skills as string[]).length === 0) {
      cleanedUpdates.nice_to_have_skills = null;
    }
    if (Array.isArray(cleanedUpdates.exclude_keywords) && (cleanedUpdates.exclude_keywords as string[]).length === 0) {
      cleanedUpdates.exclude_keywords = null;
    }
    if (Array.isArray(cleanedUpdates.seniority_levels) && (cleanedUpdates.seniority_levels as string[]).length === 0) {
      cleanedUpdates.seniority_levels = null;
    }
    
    const { data, error } = await supabase
      .from('clients')
      .update(cleanedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error updating client:', error);
      throw error;
    }
    return data;
  }

  // Application operations
  async getApplications(): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getApplicationsByClient(clientId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data || [];
  }

  async getApplicationsByApplier(applierId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('applier_id', applierId);
    
    if (error) throw error;
    return data || [];
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application | null> {
    const { data, error } = await supabase
      .from('applications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Interview operations
  async getInterviews(): Promise<Interview[]> {
    const { data, error } = await supabase
      .from('interviews')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getInterviewsByClient(clientId: string): Promise<Interview[]> {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data || [];
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const { data, error } = await supabase
      .from('interviews')
      .insert(interview)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Job operations
  async getJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data || [];
  }

  async getQueueJobs(clientId: string, applierId: string): Promise<Job[]> {
    // Get all jobs for the client
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('client_id', clientId);
    
    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) return [];
    
    // Get all applications by this applier
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('job_id')
      .eq('applier_id', applierId);
    
    if (appsError) throw appsError;
    
    // Get all flagged sessions by this applier
    const { data: flaggedSessions, error: flaggedError } = await supabase
      .from('applier_sessions')
      .select('job_id')
      .eq('applier_id', applierId)
      .eq('status', 'flagged');
    
    if (flaggedError) throw flaggedError;
    
    // Get job IDs that have been applied to or flagged
    const appliedJobIds = new Set((applications || []).map(a => a.job_id));
    const flaggedJobIds = new Set((flaggedSessions || []).map(s => s.job_id));
    
    // Filter out jobs that have already been applied to or flagged
    return jobs.filter(job => !appliedJobIds.has(job.id) && !flaggedJobIds.has(job.id));
  }

  // Applier operations
  async getAppliers(): Promise<Applier[]> {
    const { data, error } = await supabase
      .from('appliers')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getApplier(id: string): Promise<Applier | null> {
    const { data, error } = await supabase
      .from('appliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createApplier(applier: InsertApplier): Promise<Applier> {
    const { data, error } = await supabase
      .from('appliers')
      .insert(applier)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateApplier(id: string, updates: UpdateApplier): Promise<Applier | null> {
    const { data, error } = await supabase
      .from('appliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Client document operations
  async getClientDocuments(clientId: string): Promise<ClientDocument[]> {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data || [];
  }

  async createClientDocument(document: InsertClientDocument): Promise<ClientDocument> {
    // Upsert - update if same client_id + document_type exists, otherwise insert
    const { data, error } = await supabase
      .from('client_documents')
      .upsert(document, { 
        onConflict: 'client_id,document_type',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteClientDocument(clientId: string, documentType: string): Promise<void> {
    const { error } = await supabase
      .from('client_documents')
      .delete()
      .eq('client_id', clientId)
      .eq('document_type', documentType);
    
    if (error) throw error;
  }

  // Job criteria sample operations
  async getJobSamples(clientId: string): Promise<JobCriteriaSample[]> {
    const { data, error } = await supabase
      .from('job_criteria_samples')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getJobSampleById(id: string): Promise<JobCriteriaSample | null> {
    const { data, error } = await supabase
      .from('job_criteria_samples')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createJobSample(sample: InsertJobCriteriaSample): Promise<JobCriteriaSample> {
    const { data, error } = await supabase
      .from('job_criteria_samples')
      .insert(sample)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateJobSample(id: string, updates: UpdateJobCriteriaSample): Promise<JobCriteriaSample | null> {
    const { data, error } = await supabase
      .from('job_criteria_samples')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async deleteJobSample(id: string): Promise<void> {
    const { error } = await supabase
      .from('job_criteria_samples')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Client job response operations
  async getJobResponses(clientId: string): Promise<ClientJobResponse[]> {
    const { data, error } = await supabase
      .from('client_job_responses')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data || [];
  }

  async createJobResponse(response: InsertClientJobResponse): Promise<ClientJobResponse> {
    const sampleData = {
      ...response,
      responded_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('client_job_responses')
      .insert(sampleData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Applier job session operations
  // Note: Uses Supabase's relational query to join with jobs table
  async getApplierSessions(applierId: string): Promise<ApplierJobSession[]> {
    const { data, error } = await supabase
      .from('applier_job_sessions')
      .select(`
        *,
        job:jobs(job_title, company_name, job_url, client_id)
      `)
      .eq('applier_id', applierId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getApplierSession(id: string): Promise<ApplierJobSession | null> {
    const { data, error } = await supabase
      .from('applier_job_sessions')
      .select(`
        *,
        job:jobs(job_title, company_name, job_url, client_id)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getApplierSessionByJob(jobId: string, applierId: string): Promise<ApplierJobSession | null> {
    const { data, error } = await supabase
      .from('applier_job_sessions')
      .select(`
        *,
        job:jobs(job_title, company_name, job_url, client_id)
      `)
      .eq('job_id', jobId)
      .eq('applier_id', applierId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createApplierSession(session: InsertApplierJobSession): Promise<ApplierJobSession> {
    const { data, error } = await supabase
      .from('applier_job_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateApplierSession(id: string, updates: UpdateApplierJobSession): Promise<ApplierJobSession | null> {
    const { data, error } = await supabase
      .from('applier_job_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Flagged application operations
  async getFlaggedApplications(): Promise<FlaggedApplication[]> {
    const { data, error } = await supabase
      .from('flagged_applications')
      .select(`
        *,
        session:applier_job_sessions(
          *,
          job:jobs(*),
          applier:appliers(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getFlaggedApplicationsByStatus(status: "open" | "resolved"): Promise<FlaggedApplication[]> {
    const { data, error } = await supabase
      .from('flagged_applications')
      .select(`
        *,
        session:applier_job_sessions(
          *,
          job:jobs(*),
          applier:appliers(*)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createFlaggedApplication(flagged: InsertFlaggedApplication): Promise<FlaggedApplication> {
    const { data, error } = await supabase
      .from('flagged_applications')
      .insert(flagged)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateFlaggedApplication(id: string, updates: UpdateFlaggedApplication): Promise<FlaggedApplication | null> {
    const { data, error } = await supabase
      .from('flagged_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Applier earnings operations
  async getApplierEarnings(applierId: string): Promise<ApplierEarning[]> {
    const { data, error } = await supabase
      .from('applier_earnings')
      .select('*')
      .eq('applier_id', applierId)
      .order('earned_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getApplierEarningsByDateRange(applierId: string, startDate: string, endDate: string): Promise<ApplierEarning[]> {
    const { data, error } = await supabase
      .from('applier_earnings')
      .select('*')
      .eq('applier_id', applierId)
      .gte('earned_date', startDate)
      .lte('earned_date', endDate)
      .order('earned_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createApplierEarning(earning: InsertApplierEarning): Promise<ApplierEarning> {
    const earningData = {
      ...earning,
      earned_date: earning.earned_date || new Date().toISOString().split('T')[0],
    };
    
    const { data, error } = await supabase
      .from('applier_earnings')
      .insert(earningData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateApplierEarning(id: string, updates: UpdateApplierEarning): Promise<ApplierEarning | null> {
    const { data, error } = await supabase
      .from('applier_earnings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getEarningsByClient(clientId: string): Promise<ApplierEarning[]> {
    const { data, error } = await supabase
      .from('applier_earnings')
      .select('*')
      .eq('client_id', clientId)
      .order('earned_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getAllEarnings(): Promise<ApplierEarning[]> {
    const { data, error } = await supabase
      .from('applier_earnings')
      .select('*')
      .order('earned_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

export const storage = new SupabaseStorage();
