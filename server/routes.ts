import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, updateClientSchema, insertApplicationSchema, insertInterviewSchema, insertClientDocumentSchema, insertJobCriteriaSampleSchema, insertClientJobResponseSchema, updateJobCriteriaSampleSchema } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { scrapeJobUrl } from "./apify";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = updateClientSchema.parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ error: "Failed to update client" });
    }
  });

  // Application routes
  app.get("/api/applications", async (req, res) => {
    try {
      const { client_id, applier_id } = req.query;
      
      let applications;
      if (client_id) {
        applications = await storage.getApplicationsByClient(client_id as string);
      } else if (applier_id) {
        applications = await storage.getApplicationsByApplier(applier_id as string);
      } else {
        applications = await storage.getApplications();
      }
      
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(400).json({ error: "Failed to create application" });
    }
  });

  // Interview routes
  app.get("/api/interviews", async (req, res) => {
    try {
      const { client_id } = req.query;
      
      const interviews = client_id 
        ? await storage.getInterviewsByClient(client_id as string)
        : await storage.getInterviews();
      
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ error: "Failed to fetch interviews" });
    }
  });

  app.post("/api/interviews", async (req, res) => {
    try {
      const validatedData = insertInterviewSchema.parse(req.body);
      const interview = await storage.createInterview(validatedData);
      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(400).json({ error: "Failed to create interview" });
    }
  });

  // Job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const { client_id } = req.query;
      
      const jobs = client_id
        ? await storage.getJobsByClient(client_id as string)
        : await storage.getJobs();
      
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Applier routes
  app.get("/api/appliers", async (req, res) => {
    try {
      const appliers = await storage.getAppliers();
      res.json(appliers);
    } catch (error) {
      console.error("Error fetching appliers:", error);
      res.status(500).json({ error: "Failed to fetch appliers" });
    }
  });

  app.get("/api/appliers/:id", async (req, res) => {
    try {
      const applier = await storage.getApplier(req.params.id);
      if (!applier) {
        return res.status(404).json({ error: "Applier not found" });
      }
      res.json(applier);
    } catch (error) {
      console.error("Error fetching applier:", error);
      res.status(500).json({ error: "Failed to fetch applier" });
    }
  });

  // Client document routes
  app.get("/api/clients/:clientId/documents", async (req, res) => {
    try {
      const documents = await storage.getClientDocuments(req.params.clientId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching client documents:", error);
      res.status(500).json({ error: "Failed to fetch client documents" });
    }
  });

  app.post("/api/clients/:clientId/documents", async (req, res) => {
    try {
      const validatedData = insertClientDocumentSchema.parse({
        ...req.body,
        client_id: req.params.clientId,
      });
      const document = await storage.createClientDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating client document:", error);
      res.status(400).json({ error: "Failed to create client document" });
    }
  });

  app.delete("/api/clients/:clientId/documents/:documentType", async (req, res) => {
    try {
      await storage.deleteClientDocument(req.params.clientId, req.params.documentType);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client document:", error);
      res.status(500).json({ error: "Failed to delete client document" });
    }
  });

  // Job sample routes
  app.get("/api/clients/:clientId/job-samples", async (req, res) => {
    try {
      const samples = await storage.getJobSamples(req.params.clientId);
      res.json(samples);
    } catch (error) {
      console.error("Error fetching job samples:", error);
      res.status(500).json({ error: "Failed to fetch job samples" });
    }
  });

  app.post("/api/clients/:clientId/job-samples", async (req, res) => {
    try {
      const validatedData = insertJobCriteriaSampleSchema.parse({
        ...req.body,
        client_id: req.params.clientId,
      });
      const sample = await storage.createJobSample(validatedData);
      res.status(201).json(sample);
    } catch (error) {
      console.error("Error creating job sample:", error);
      res.status(400).json({ error: "Failed to create job sample" });
    }
  });

  app.post("/api/clients/:clientId/job-samples/bulk", async (req, res) => {
    try {
      const { urls } = req.body;
      if (!Array.isArray(urls)) {
        return res.status(400).json({ error: "urls must be an array" });
      }
      
      const samples = [];
      for (const url of urls) {
        if (typeof url !== 'string' || !url.trim()) continue;
        
        const sample = await storage.createJobSample({
          client_id: req.params.clientId,
          source_url: url.trim(),
          scrape_status: "pending",
        });
        samples.push(sample);
      }
      
      res.status(201).json(samples);
    } catch (error) {
      console.error("Error creating bulk job samples:", error);
      res.status(500).json({ error: "Failed to create job samples" });
    }
  });

  app.patch("/api/job-samples/:id", async (req, res) => {
    try {
      const validatedData = updateJobCriteriaSampleSchema.parse(req.body);
      const sample = await storage.updateJobSample(req.params.id, validatedData);
      if (!sample) {
        return res.status(404).json({ error: "Job sample not found" });
      }
      res.json(sample);
    } catch (error: any) {
      console.error("Error updating job sample:", error);
      if (error?.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update job sample" });
    }
  });

  app.delete("/api/job-samples/:id", async (req, res) => {
    try {
      await storage.deleteJobSample(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job sample:", error);
      res.status(500).json({ error: "Failed to delete job sample" });
    }
  });

  app.post("/api/job-samples/:id/scrape", async (req, res) => {
    try {
      if (!process.env.APIFY_API_TOKEN) {
        return res.status(500).json({ error: "Apify API token not configured. Please add APIFY_API_TOKEN to environment secrets." });
      }
      
      const sample = await storage.getJobSampleById(req.params.id);
      if (!sample) {
        return res.status(404).json({ error: "Job sample not found" });
      }
      
      const scrapedData = await scrapeJobUrl(sample.source_url);
      
      if (scrapedData) {
        await storage.updateJobSample(req.params.id, {
          title: scrapedData.title,
          company_name: scrapedData.company_name,
          location: scrapedData.location,
          is_remote: scrapedData.is_remote,
          job_type: scrapedData.job_type,
          description: scrapedData.description,
          required_skills: scrapedData.required_skills,
          experience_level: scrapedData.experience_level,
          apply_url: scrapedData.apply_url,
          salary_min: scrapedData.salary_min,
          salary_max: scrapedData.salary_max,
          company_logo_url: scrapedData.company_logo_url,
          raw_data: scrapedData.raw_data,
          scrape_status: "complete",
          scraped_at: new Date().toISOString(),
        });
        const updatedSample = await storage.getJobSampleById(req.params.id);
        const { raw_data, ...safeResponse } = updatedSample || {};
        res.json(safeResponse);
      } else {
        await storage.updateJobSample(req.params.id, {
          scrape_status: "failed",
        });
        const updatedSample = await storage.getJobSampleById(req.params.id);
        const { raw_data, ...safeResponse } = updatedSample || {};
        res.json(safeResponse);
      }
    } catch (error) {
      console.error("Error scraping job sample:", error);
      res.status(500).json({ error: "Failed to scrape job sample. Check server logs for details." });
    }
  });

  // Client job response routes
  app.get("/api/clients/:clientId/job-responses", async (req, res) => {
    try {
      const responses = await storage.getJobResponses(req.params.clientId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching job responses:", error);
      res.status(500).json({ error: "Failed to fetch job responses" });
    }
  });

  app.post("/api/clients/:clientId/job-responses", async (req, res) => {
    try {
      const validatedData = insertClientJobResponseSchema.parse({
        ...req.body,
        client_id: req.params.clientId,
      });
      
      if (validatedData.verdict === 'no' && !validatedData.comment?.trim()) {
        return res.status(400).json({ error: "Comment is required when verdict is 'no'" });
      }
      
      const response = await storage.createJobResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating job response:", error);
      res.status(400).json({ error: "Failed to create job response" });
    }
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  return httpServer;
}
