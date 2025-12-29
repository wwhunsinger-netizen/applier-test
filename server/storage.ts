import type { Client, Application, Interview, Job, Applier, InsertClient, UpdateClient, InsertApplication, InsertInterview, ClientDocument, InsertClientDocument, JobCriteriaSample, InsertJobCriteriaSample, UpdateJobCriteriaSample, ClientJobResponse, InsertClientJobResponse } from "@shared/schema";
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
  
  // Interview operations
  getInterviews(): Promise<Interview[]>;
  getInterviewsByClient(clientId: string): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  
  // Job operations
  getJobs(): Promise<Job[]>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  
  // Applier operations
  getAppliers(): Promise<Applier[]>;
  getApplier(id: string): Promise<Applier | null>;
  
  // Client document operations
  getClientDocuments(clientId: string): Promise<ClientDocument[]>;
  createClientDocument(document: InsertClientDocument): Promise<ClientDocument>;
  deleteClientDocument(clientId: string, documentType: string): Promise<void>;
  
  // Job criteria sample operations
  getJobSamples(clientId: string): Promise<JobCriteriaSample[]>;
  createJobSample(sample: InsertJobCriteriaSample): Promise<JobCriteriaSample>;
  updateJobSample(id: string, updates: UpdateJobCriteriaSample): Promise<JobCriteriaSample | null>;
  deleteJobSample(id: string): Promise<void>;
  
  // Client job response operations
  getJobResponses(clientId: string): Promise<ClientJobResponse[]>;
  createJobResponse(response: InsertClientJobResponse): Promise<ClientJobResponse>;
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
    const { data, error } = await supabase
      .from('clients')
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
}

export const storage = new SupabaseStorage();
