import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, updateClientSchema, insertApplierSchema, updateApplierSchema, insertApplicationSchema, insertInterviewSchema, insertClientDocumentSchema, insertJobCriteriaSampleSchema, insertClientJobResponseSchema, updateJobCriteriaSampleSchema, insertApplierJobSessionSchema, insertFlaggedApplicationSchema, updateFlaggedApplicationSchema } from "@shared/schema";
import { registerObjectStorageRoutes, objectStorageService } from "./replit_integrations/object_storage";
import { scrapeJobUrl } from "./apify";
import { presenceService } from "./presence";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize WebSocket presence tracking for appliers
  presenceService.init(httpServer);
  
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

  app.post("/api/appliers", async (req, res) => {
    try {
      console.log("Creating applier with data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertApplierSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      const applier = await storage.createApplier(validatedData);
      console.log("Created applier:", JSON.stringify(applier, null, 2));
      res.status(201).json(applier);
    } catch (error: any) {
      console.error("Error creating applier:", error.message || error);
      console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      res.status(400).json({ error: "Failed to create applier" });
    }
  });

  app.patch("/api/appliers/:id", async (req, res) => {
    try {
      const validatedData = updateApplierSchema.parse(req.body);
      
      // Sanitize empty strings to null to avoid unique constraint violations
      const sanitizedData = Object.fromEntries(
        Object.entries(validatedData).map(([key, value]) => [
          key,
          value === "" ? null : value
        ])
      );
      
      const applier = await storage.updateApplier(req.params.id, sanitizedData);
      if (!applier) {
        return res.status(404).json({ error: "Applier not found" });
      }
      res.json(applier);
    } catch (error) {
      console.error("Error updating applier:", error);
      res.status(400).json({ error: "Failed to update applier" });
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

  // Download client document from object storage
  app.get("/api/clients/:clientId/documents/:documentType/download", async (req, res) => {
    try {
      const documents = await storage.getClientDocuments(req.params.clientId);
      const doc = documents.find(d => d.document_type === req.params.documentType);
      
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Use object storage service to stream the file with proper authentication
      const objectFile = await objectStorageService.getObjectEntityFile(doc.object_path);
      
      // Set content disposition header for download with original filename
      res.set({
        "Content-Disposition": `attachment; filename="${doc.file_name}"`,
      });
      
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading client document:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download document" });
      }
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

  // ========================================
  // APPLIER STATS ROUTES
  // ========================================
  
  // Get applier dashboard stats
  app.get("/api/applier-stats/:applierId", async (req, res) => {
    try {
      const applierId = req.params.applierId;
      
      // Get today's date range (UTC)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      
      // Get start of week (Sunday)
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).toISOString();
      
      // Get all applications for this applier
      const allApps = await storage.getApplicationsByApplier(applierId);
      
      // Filter today's applications
      const todayApps = allApps.filter(app => {
        const appDate = new Date(app.applied_at || app.applied_date || app.created_at || '');
        return appDate >= new Date(startOfDay) && appDate < new Date(endOfDay);
      });
      
      // Filter this week's applications
      const weekApps = allApps.filter(app => {
        const appDate = new Date(app.applied_at || app.applied_date || app.created_at || '');
        return appDate >= new Date(startOfWeek);
      });
      
      // Get today's sessions for time tracking
      const allSessions = await storage.getApplierSessions(applierId);
      const todaySessions = allSessions.filter(s => {
        const sessionDate = new Date(s.started_at || s.created_at || '');
        return sessionDate >= new Date(startOfDay) && sessionDate < new Date(endOfDay);
      });
      
      // Calculate time worked today (from completed sessions)
      const completedSessions = todaySessions.filter(s => s.status === 'applied');
      const totalSeconds = completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const timeWorked = `${hours}:${mins.toString().padStart(2, '0')}`;
      
      // Calculate average time per app
      const avgSeconds = todayApps.length > 0 ? Math.round(totalSeconds / todayApps.length) : 0;
      const avgMins = Math.floor(avgSeconds / 60);
      const avgSecs = avgSeconds % 60;
      const avgTimePerApp = todayApps.length > 0 ? `${avgMins}:${avgSecs.toString().padStart(2, '0')}` : '-';
      
      // Get jobs waiting in queue for this applier's assigned clients
      const applier = await storage.getApplier(applierId);
      let jobsWaiting = 0;
      if (applier?.assigned_client_ids?.length) {
        const jobs = await storage.getJobs();
        // Filter jobs for assigned clients that haven't been applied to yet
        const appliedJobIds = new Set(allApps.map(a => a.job_id));
        const flaggedSessionIds = new Set(allSessions.filter(s => s.status === 'flagged').map(s => s.job_id));
        
        jobsWaiting = jobs.filter(j => 
          applier.assigned_client_ids?.includes(j.client_id) && 
          !appliedJobIds.has(j.id) &&
          !flaggedSessionIds.has(j.id)
        ).length;
      }
      
      // Calculate projected finish time (remaining apps * avg time)
      const dailyGoal = 50; // Could come from settings
      const remaining = Math.max(0, dailyGoal - todayApps.length);
      let projectedFinish = '-';
      if (remaining > 0 && avgSeconds > 0) {
        const remainingSeconds = remaining * avgSeconds;
        const finishHours = Math.floor(remainingSeconds / 3600);
        const finishMins = Math.floor((remainingSeconds % 3600) / 60);
        projectedFinish = finishHours > 0 ? `${finishHours}h ${finishMins}m` : `${finishMins}m`;
      } else if (remaining === 0) {
        projectedFinish = 'Done!';
      }
      
      // Calculate interview rate (apps with interviews / total apps)
      const interviewApps = allApps.filter(a => a.status === 'interview' || a.status === 'Interview');
      const interviewRate = allApps.length > 0 ? Math.round((interviewApps.length / allApps.length) * 100) : 0;
      
      // Calculate QA error rate (apps with qa_status = Rejected / total apps)
      const qaRejected = allApps.filter(a => a.qa_status === 'Rejected');
      const qaErrorRate = allApps.length > 0 ? Math.round((qaRejected.length / allApps.length) * 100) : 0;
      
      // Weekly earnings: $0.50 per app (can adjust)
      const weeklyEarnings = weekApps.length * 0.50;
      
      res.json({
        dailyApps: todayApps.length,
        dailyGoal,
        timeWorked,
        avgTimePerApp,
        projectedFinish,
        weeklyApps: weekApps.length,
        weeklyEarnings,
        interviewRate,
        qaErrorRate,
        jobsWaiting,
        totalApps: allApps.length,
      });
    } catch (error) {
      console.error("Error fetching applier stats:", error);
      res.status(500).json({ error: "Failed to fetch applier stats" });
    }
  });

  // ========================================
  // APPLIER JOB SESSION ROUTES
  // ========================================
  
  // Get applier's sessions
  app.get("/api/applier-sessions", async (req, res) => {
    try {
      const { applier_id } = req.query;
      
      if (!applier_id) {
        return res.status(400).json({ error: "applier_id query parameter required" });
      }
      
      const sessions = await storage.getApplierSessions(applier_id as string);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching applier sessions:", error);
      res.status(500).json({ error: "Failed to fetch applier sessions" });
    }
  });

  // Start review - creates session with in_progress status and records start time
  app.post("/api/applier-sessions/start-review", async (req, res) => {
    try {
      const { job_id, applier_id } = req.body;
      
      if (!job_id || !applier_id) {
        return res.status(400).json({ error: "job_id and applier_id are required" });
      }
      
      // Check if session already exists for this job/applier
      const existingSession = await storage.getApplierSessionByJob(job_id, applier_id);
      
      if (existingSession) {
        // Update existing session to in_progress with new start time
        const updated = await storage.updateApplierSession(existingSession.id, {
          status: "in_progress",
          started_at: new Date().toISOString(),
        });
        return res.json(updated);
      }
      
      // Create new session (job details come from jobs table via JOIN)
      const session = await storage.createApplierSession({
        job_id,
        applier_id,
        status: "in_progress",
      });
      
      // Update the session with started_at
      const updated = await storage.updateApplierSession(session.id, {
        started_at: new Date().toISOString(),
      });
      
      res.status(201).json(updated || session);
    } catch (error) {
      console.error("Error starting review session:", error);
      res.status(500).json({ error: "Failed to start review session" });
    }
  });

  // Mark applied - updates session, creates application record
  app.post("/api/applier-sessions/:sessionId/applied", async (req, res) => {
    try {
      const session = await storage.getApplierSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.status !== "in_progress") {
        return res.status(400).json({ error: "Can only mark applied for in_progress sessions" });
      }
      
      const completedAt = new Date();
      const startedAt = session.started_at ? new Date(session.started_at) : completedAt;
      const durationSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);
      
      // Update session to applied
      const updatedSession = await storage.updateApplierSession(req.params.sessionId, {
        status: "applied",
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds,
      });
      
      // Create application record (client_id comes from joined job data)
      const clientId = session.job?.client_id;
      if (!clientId) {
        return res.status(400).json({ error: "Job has no associated client" });
      }
      
      // Get job details from session for the application snapshot
      const job = session.job as any;
      
      const application = await storage.createApplication({
        job_id: session.job_id,
        applier_id: session.applier_id,
        client_id: clientId,
        status: "applied",
        applied_date: completedAt.toISOString(),
        // Job snapshot fields (NOT NULL in Supabase)
        job_title: job?.job_title || job?.title || "Unknown Position",
        company_name: job?.company_name || job?.company || "Unknown Company",
        job_url: job?.job_url || job?.url || "",
      });
      
      res.json({ session: updatedSession, application });
    } catch (error) {
      console.error("Error marking session as applied:", error);
      res.status(500).json({ error: "Failed to mark as applied" });
    }
  });

  // Flag job - creates flagged application for admin review
  app.post("/api/applier-sessions/:sessionId/flag", async (req, res) => {
    try {
      const { comment } = req.body;
      
      if (!comment?.trim()) {
        return res.status(400).json({ error: "Comment is required when flagging a job" });
      }
      
      const session = await storage.getApplierSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.status === "flagged") {
        return res.status(400).json({ error: "Job is already flagged" });
      }
      
      if (session.status === "applied") {
        return res.status(400).json({ error: "Cannot flag an already applied job" });
      }
      
      // Update session to flagged
      const updatedSession = await storage.updateApplierSession(req.params.sessionId, {
        status: "flagged",
        flag_comment: comment.trim(),
      });
      
      // Create flagged application for admin review (job details come from session → job JOIN)
      const flaggedApp = await storage.createFlaggedApplication({
        session_id: session.id,
        comment: comment.trim(),
        status: "open",
      });
      
      res.json({ session: updatedSession, flaggedApplication: flaggedApp });
    } catch (error) {
      console.error("Error flagging job:", error);
      res.status(500).json({ error: "Failed to flag job" });
    }
  });

  // ========================================
  // FLAGGED APPLICATIONS ROUTES (Admin)
  // ========================================
  
  app.get("/api/flagged-applications", async (req, res) => {
    try {
      const { status } = req.query;
      
      let flaggedApps;
      if (status === "open" || status === "resolved") {
        flaggedApps = await storage.getFlaggedApplicationsByStatus(status);
      } else {
        flaggedApps = await storage.getFlaggedApplications();
      }
      
      res.json(flaggedApps);
    } catch (error) {
      console.error("Error fetching flagged applications:", error);
      res.status(500).json({ error: "Failed to fetch flagged applications" });
    }
  });

  app.patch("/api/flagged-applications/:id", async (req, res) => {
    try {
      const validatedData = updateFlaggedApplicationSchema.parse(req.body);
      
      // Auto-set resolved_at when status changes to resolved
      if (validatedData.status === "resolved" && !validatedData.resolved_at) {
        validatedData.resolved_at = new Date().toISOString();
      }
      
      const updated = await storage.updateFlaggedApplication(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Flagged application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating flagged application:", error);
      res.status(400).json({ error: "Failed to update flagged application" });
    }
  });

  // ========================================
  // EXTERNAL API - For cofounder's search app
  // ========================================
  
  // Middleware to check external API key
  const validateExternalApiKey = (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    const validApiKey = process.env.EXTERNAL_API_KEY;
    
    if (!validApiKey) {
      console.error("EXTERNAL_API_KEY not configured");
      return res.status(500).json({ error: "API not configured" });
    }
    
    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({ error: "Invalid or missing API key" });
    }
    
    next();
  };

  // Get all clients with their job criteria (for search app)
  app.get("/api/external/clients", validateExternalApiKey, async (req, res) => {
    try {
      const clients = await storage.getClients();
      // Return only job criteria fields (no sensitive data)
      const clientCriteria = clients.map(c => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        status: c.status,
        target_job_titles: c.target_job_titles || [],
        required_skills: c.required_skills || [],
        nice_to_have_skills: c.nice_to_have_skills || [],
        exclude_keywords: c.exclude_keywords || [],
        years_of_experience: c.years_of_experience,
        seniority_levels: c.seniority_levels || [],
        job_criteria_signoff: c.job_criteria_signoff
      }));
      res.json(clientCriteria);
    } catch (error) {
      console.error("Error fetching clients for external API:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Get single client job criteria (for search app)
  app.get("/api/external/clients/:id/job-criteria", validateExternalApiKey, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      // Return only job criteria fields (no sensitive data like Gmail credentials)
      res.json({
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        status: client.status,
        target_job_titles: client.target_job_titles || [],
        required_skills: client.required_skills || [],
        nice_to_have_skills: client.nice_to_have_skills || [],
        exclude_keywords: client.exclude_keywords || [],
        years_of_experience: client.years_of_experience,
        seniority_levels: client.seniority_levels || [],
        job_criteria_signoff: client.job_criteria_signoff
      });
    } catch (error) {
      console.error("Error fetching client for external API:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  return httpServer;
}
