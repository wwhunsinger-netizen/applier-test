import type { Client, Application, Interview, Job, Applier, InsertClient, UpdateClient, InsertApplication, InsertInterview } from "@shared/schema";
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
}

export const storage = new SupabaseStorage();
