import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertClientSchema,
  updateClientSchema,
  insertApplierSchema,
  updateApplierSchema,
  insertApplicationSchema,
  insertInterviewSchema,
  insertClientDocumentSchema,
  insertJobCriteriaSampleSchema,
  insertClientJobResponseSchema,
  updateJobCriteriaSampleSchema,
  insertApplierJobSessionSchema,
  insertFlaggedApplicationSchema,
  updateFlaggedApplicationSchema,
} from "@shared/schema";
import {
  registerObjectStorageRoutes,
  objectStorageService,
} from "./replit_integrations/object_storage";
import { scrapeJobUrl } from "./apify";
import { presenceService } from "./presence";
import { isSupabaseAuthenticated } from "./supabaseAuth";
import { supabase } from "./supabase";
import crypto from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Initialize WebSocket presence tracking for appliers
  presenceService.init(httpServer);

  // ========================================
  // EXTERNAL API - For cofounder's search app
  // ========================================

  // Middleware to check external API key
  const validateExternalApiKey = (req: any, res: any, next: any) => {
    const apiKey =
      req.headers["x-api-key"] ||
      req.headers["authorization"]?.replace("Bearer ", "");
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

  // Client routes (protected with Supabase auth)
  app.get("/api/clients", isSupabaseAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isSupabaseAuthenticated, async (req, res) => {
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

  app.post("/api/clients", isSupabaseAuthenticated, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);

      // Generate a random password and create Supabase auth user first
      const generatedPassword = crypto
        .randomBytes(8)
        .toString("base64")
        .slice(0, 12);
      console.log(
        `[DEBUG] Creating applier ${validatedData.email} with password: ${generatedPassword}`,
      );
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: validatedData.email,
          password: generatedPassword,
          email_confirm: true,
          user_metadata: {
            first_name: validatedData.first_name,
            last_name: validatedData.last_name,
          },
        });

      if (authError) {
        console.error(
          `[auth] Failed to create Supabase user for client ${validatedData.email}:`,
          authError.message,
        );
        return res.status(500).json({
          error: `Failed to create auth account: ${authError.message}`,
        });
      }

      console.log(
        `[auth] Created Supabase user for client: ${validatedData.email}`,
      );

      // Now create the client record - rollback auth user if this fails
      let client;
      try {
        client = await storage.createClient(validatedData);
      } catch (dbError) {
        // Rollback: delete the Supabase auth user since DB insert failed
        console.error(
          `[auth] DB insert failed for client ${validatedData.email}, rolling back auth user`,
        );
        if (authData.user) {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log(
            `[auth] Rolled back Supabase user for client: ${validatedData.email}`,
          );
        }
        throw dbError;
      }

      // Return the client with the generated password (so admin can share it)
      res.status(201).json({ ...client, generatedPassword });
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", isSupabaseAuthenticated, async (req, res) => {
    try {
      const validatedData = updateClientSchema.parse(req.body);

      // Check if client is being placed (status changed to "placed")
      const existingClient = await storage.getClient(req.params.id);
      const isBeingPlaced =
        validatedData.status === "placed" &&
        existingClient?.status !== "placed";

      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Create placement bonus ($400) when client is placed
      if (isBeingPlaced) {
        try {
          const today = new Date().toISOString().split("T")[0];

          // Get the appliers who worked on this client's applications
          const applications = await storage.getApplicationsByClient(
            req.params.id,
          );
          const applierIds = applications
            .map((a) => a.applier_id)
            .filter(Boolean) as string[];
          const uniqueApplierSet = new Set(applierIds);
          let uniqueAppliers = Array.from(uniqueApplierSet);

          // Fallback: if no applications exist, check if client has an assigned applier
          const clientWithApplier = client as any;
          if (uniqueAppliers.length === 0 && clientWithApplier.applier_id) {
            uniqueAppliers = [clientWithApplier.applier_id];
          }

          // Check for existing placement bonuses to prevent duplicates
          const existingEarnings = await storage.getEarningsByClient(
            req.params.id,
          );
          const existingPlacementBonuses = existingEarnings.filter(
            (e) => e.earnings_type === "placement_bonus",
          );
          const appliersWithBonus = new Set(
            existingPlacementBonuses.map((e) => e.applier_id),
          );

          // Create placement bonus for each applier who worked on this client (if not already awarded)
          for (const applierId of uniqueAppliers) {
            if (applierId && !appliersWithBonus.has(applierId)) {
              await storage.createApplierEarning({
                applier_id: applierId,
                client_id: req.params.id,
                earnings_type: "placement_bonus",
                amount: 400,
                earned_date: today,
                payment_status: "pending",
                notes: `Placement bonus for ${client.first_name} ${client.last_name}`,
              });
            }
          }
        } catch (bonusError) {
          console.error("Error creating placement bonus:", bonusError);
          // Don't fail the client update if bonus fails
        }
      }

      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ error: "Failed to update client" });
    }
  });
  app.delete("/api/clients/:id", isSupabaseAuthenticated, async (req, res) => {
    try {
      const clientId = req.params.id;

      // Delete related records first (foreign key constraints)
      const { error: appsError } = await supabase
        .from("applications")
        .delete()
        .eq("client_id", clientId);
      if (appsError) console.error("Error deleting applications:", appsError);

      const { error: interviewsError } = await supabase
        .from("interviews")
        .delete()
        .eq("client_id", clientId);
      if (interviewsError)
        console.error("Error deleting interviews:", interviewsError);

      const { error: jobsError } = await supabase
        .from("jobs")
        .delete()
        .eq("client_id", clientId);
      if (jobsError) console.error("Error deleting jobs:", jobsError);

      const { error: earningsError } = await supabase
        .from("applier_earnings")
        .delete()
        .eq("client_id", clientId);
      if (earningsError)
        console.error("Error deleting earnings:", earningsError);

      const { error: docsError } = await supabase
        .from("client_documents")
        .delete()
        .eq("client_id", clientId);
      if (docsError) console.error("Error deleting documents:", docsError);

      const { error: samplesError } = await supabase
        .from("job_criteria_samples")
        .delete()
        .eq("client_id", clientId);
      if (samplesError)
        console.error("Error deleting job samples:", samplesError);

      const { error: clientError } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (clientError) {
        console.error("Error deleting client:", clientError);
        return res.status(500).json({ error: "Failed to delete client" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });
  // Application routes
  app.get("/api/applications", isSupabaseAuthenticated, async (req, res) => {
    try {
      const { client_id, applier_id } = req.query;

      let applications;
      if (client_id) {
        applications = await storage.getApplicationsByClient(
          client_id as string,
        );
      } else if (applier_id) {
        applications = await storage.getApplicationsByApplier(
          applier_id as string,
        );
      } else {
        applications = await storage.getApplications();
      }

      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", isSupabaseAuthenticated, async (req, res) => {
    try {
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(400).json({ error: "Failed to create application" });
    }
  });

  app.patch(
    "/api/applications/:id",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const updates = req.body;

        // Get the current application to check status change
        const currentApp = await storage.getApplication(req.params.id);
        if (!currentApp) {
          return res.status(404).json({ error: "Application not found" });
        }

        const updated = await storage.updateApplication(req.params.id, updates);
        if (!updated) {
          return res
            .status(404)
            .json({ error: "Failed to update application" });
        }

        // When status changes to Interview: create interview record + award $50 bonus
        if (
          updates.status?.toLowerCase() === "interview" &&
          currentApp.status?.toLowerCase() !== "interview"
        ) {
          try {
            const today = new Date().toISOString().split("T")[0];

            // Create interview record
            await storage.createInterview({
              application_id: req.params.id, // Required!
              client_id: currentApp.client_id,
              company_name: currentApp.company_name,
              job_title: currentApp.job_title,
              interview_datetime: new Date().toISOString(),
              interview_type: "Phone",
              prep_doc_status: "pending",
            });
            console.log(
              `[Interview] Created interview record for ${currentApp.company_name}`,
            );

            // Award $50 interview bonus
            await storage.createApplierEarning({
              applier_id: currentApp.applier_id,
              client_id: currentApp.client_id,
              earnings_type: "interview_bonus",
              amount: 50,
              earned_date: today,
              payment_status: "pending",
              notes: `Interview for ${currentApp.job_title} at ${currentApp.company_name}`,
            });
            console.log(
              `[Earnings] Awarded $50 interview bonus to applier ${currentApp.applier_id}`,
            );
          } catch (bonusError) {
            console.error("Error creating interview/bonus:", bonusError);
          }
        }

        res.json(updated);
      } catch (error) {
        console.error("Error updating application:", error);
        res.status(400).json({ error: "Failed to update application" });
      }
    },
  );

  // Interview routes
  app.get("/api/interviews", isSupabaseAuthenticated, async (req, res) => {
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

  app.post("/api/interviews", isSupabaseAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInterviewSchema.parse(req.body);
      const interview = await storage.createInterview(validatedData);

      // Create interview bonus earning ($50 per interview)
      try {
        const today = new Date().toISOString().split("T")[0];

        // Find the most recent application for this client to get the applier_id
        const applications = await storage.getApplicationsByClient(
          validatedData.client_id,
        );
        const recentApplication = applications[0];

        if (recentApplication?.applier_id) {
          await storage.createApplierEarning({
            applier_id: recentApplication.applier_id,
            client_id: validatedData.client_id,
            earnings_type: "interview_bonus",
            amount: 50,
            interview_id: interview.id,
            earned_date: today,
            payment_status: "pending",
            notes: `Interview scheduled for ${validatedData.company_name || "unknown company"}`,
          });
        }
      } catch (bonusError) {
        console.error("Error creating interview bonus:", bonusError);
        // Don't fail the interview creation if bonus fails
      }

      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(400).json({ error: "Failed to create interview" });
    }
  });

  // Job routes
  app.get("/api/jobs", isSupabaseAuthenticated, async (req, res) => {
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

  // Get queue jobs (excludes already-applied jobs for the applier)
  app.get("/api/queue-jobs", isSupabaseAuthenticated, async (req, res) => {
    try {
      const { client_id, applier_id } = req.query;

      if (!client_id || !applier_id) {
        return res
          .status(400)
          .json({ error: "client_id and applier_id are required" });
      }

      const jobs = await storage.getQueueJobs(
        client_id as string,
        applier_id as string,
      );
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching queue jobs:", error);
      res.status(500).json({ error: "Failed to fetch queue jobs" });
    }
  });

  // Job Feed Sync routes
  app.post(
    "/api/jobs/sync/:clientId",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const { clientId } = req.params;
        const { syncJobsForClient } = await import("./jobFeedSync");

        console.log(`[API] Starting job sync for client ${clientId}`);
        const result = await syncJobsForClient(clientId);

        res.json({
          success: true,
          message: `Sync complete. Added: ${result.added}, Skipped: ${result.skipped}`,
          ...result,
        });
      } catch (error) {
        console.error("Error syncing jobs:", error);
        res.status(500).json({
          error: "Failed to sync jobs",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  app.post("/api/jobs/sync-all", validateExternalApiKey, async (req, res) => {
    try {
      const { syncJobsForAllClients } = await import("./jobFeedSync");

      console.log(`[API] Starting job sync for all clients`);
      const results = await syncJobsForAllClients();

      const totals = Object.values(results).reduce(
        (acc, r) => ({
          added: acc.added + r.added,
          skipped: acc.skipped + r.skipped,
          errors: acc.errors + r.errors.length,
        }),
        { added: 0, skipped: 0, errors: 0 },
      );

      res.json({
        success: true,
        message: `Sync complete. Total added: ${totals.added}, Skipped: ${totals.skipped}, Errors: ${totals.errors}`,
        totals,
        results,
      });
    } catch (error) {
      console.error("Error syncing all jobs:", error);
      res.status(500).json({
        error: "Failed to sync jobs",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Applier routes
  app.get("/api/appliers", isSupabaseAuthenticated, async (req, res) => {
    try {
      const appliers = await storage.getAppliers();
      res.json(appliers);
    } catch (error) {
      console.error("Error fetching appliers:", error);
      res.status(500).json({ error: "Failed to fetch appliers" });
    }
  });

  app.get("/api/appliers/:id", isSupabaseAuthenticated, async (req, res) => {
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

  app.post("/api/appliers", isSupabaseAuthenticated, async (req, res) => {
    try {
      console.log(
        "Creating applier with data:",
        JSON.stringify(req.body, null, 2),
      );
      const validatedData = insertApplierSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));

      // Generate a random password and create Supabase auth user first
      const generatedPassword = crypto
        .randomBytes(8)
        .toString("base64")
        .slice(0, 12);
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: validatedData.email,
          password: generatedPassword,
          email_confirm: true,
          user_metadata: {
            first_name: validatedData.first_name,
            last_name: validatedData.last_name,
          },
        });

      if (authError) {
        console.error(
          `[auth] Failed to create Supabase user for applier ${validatedData.email}:`,
          authError.message,
        );
        return res.status(500).json({
          error: `Failed to create auth account: ${authError.message}`,
        });
      }

      console.log(
        `[auth] Created Supabase user for applier: ${validatedData.email}`,
      );

      // Now create the applier record - rollback auth user if this fails
      let applier;
      try {
        applier = await storage.createApplier(validatedData);
      } catch (dbError) {
        // Rollback: delete the Supabase auth user since DB insert failed
        console.error(
          `[auth] DB insert failed for applier ${validatedData.email}, rolling back auth user`,
        );
        if (authData.user) {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log(
            `[auth] Rolled back Supabase user for applier: ${validatedData.email}`,
          );
        }
        throw dbError;
      }
      console.log("Created applier:", JSON.stringify(applier, null, 2));

      // Update assigned clients to set their applier_id
      if (
        validatedData.assigned_client_ids &&
        validatedData.assigned_client_ids.length > 0
      ) {
        for (const clientId of validatedData.assigned_client_ids) {
          try {
            await storage.updateClient(clientId, { applier_id: applier.id });
            console.log(`[applier] Set applier_id on client ${clientId}`);
          } catch (updateError) {
            console.error(
              `[applier] Failed to update applier_id on client ${clientId}:`,
              updateError,
            );
          }
        }
      }

      // Return the applier with the generated password (so admin can share it)
      res.status(201).json({ ...applier, generatedPassword });
    } catch (error: any) {
      console.error("Error creating applier:", error.message || error);
      console.error(
        "Full error:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );
      res.status(400).json({ error: "Failed to create applier" });
    }
  });

  app.patch("/api/appliers/:id", isSupabaseAuthenticated, async (req, res) => {
    try {
      const validatedData = updateApplierSchema.parse(req.body);
      const applierId = req.params.id;

      // Sanitize empty strings to null to avoid unique constraint violations
      const sanitizedData = Object.fromEntries(
        Object.entries(validatedData).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ]),
      );

      // Get old applier data to compare assigned_client_ids
      const oldApplier = await storage.getApplier(applierId);
      const oldClientIds = oldApplier?.assigned_client_ids || [];
      const newClientIds =
        (sanitizedData.assigned_client_ids as string[] | undefined) || [];

      const applier = await storage.updateApplier(applierId, sanitizedData);
      if (!applier) {
        return res.status(404).json({ error: "Applier not found" });
      }

      // Sync applier_id on clients when assigned_client_ids changes
      if (sanitizedData.assigned_client_ids !== undefined) {
        // Remove applier_id from clients that are no longer assigned
        const removedClients = oldClientIds.filter(
          (id) => !newClientIds.includes(id),
        );
        for (const clientId of removedClients) {
          try {
            await storage.updateClient(clientId, { applier_id: null });
            console.log(`[applier] Removed applier_id from client ${clientId}`);
          } catch (updateError) {
            console.error(
              `[applier] Failed to remove applier_id from client ${clientId}:`,
              updateError,
            );
          }
        }

        // Set applier_id on newly assigned clients
        const addedClients = newClientIds.filter(
          (id) => !oldClientIds.includes(id),
        );
        for (const clientId of addedClients) {
          try {
            await storage.updateClient(clientId, { applier_id: applierId });
            console.log(`[applier] Set applier_id on client ${clientId}`);
          } catch (updateError) {
            console.error(
              `[applier] Failed to set applier_id on client ${clientId}:`,
              updateError,
            );
          }
        }
      }

      res.json(applier);
    } catch (error) {
      console.error("Error updating applier:", error);
      res.status(400).json({ error: "Failed to update applier" });
    }
  });

  // Client document routes
  app.get(
    "/api/clients/:clientId/documents",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const documents = await storage.getClientDocuments(req.params.clientId);
        res.json(documents);
      } catch (error) {
        console.error("Error fetching client documents:", error);
        res.status(500).json({ error: "Failed to fetch client documents" });
      }
    },
  );

  app.post(
    "/api/clients/:clientId/documents",
    isSupabaseAuthenticated,
    async (req, res) => {
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
    },
  );

  app.delete("/api/jobs/:jobId", isSupabaseAuthenticated, async (req, res) => {
    try {
      // Soft delete - mark as rejected instead of deleting
      const { error } = await supabase
        .from("jobs")
        .update({ status: "rejected" })
        .eq("id", req.params.jobId);

      if (error) throw error;
      res.status(204).send();
    } catch (error) {
      console.error("Error rejecting job:", error);
      res.status(500).json({ error: "Failed to reject job" });
    }
  });

  // Download client document from object storage
  app.get(
    "/api/clients/:clientId/documents/:documentType/download",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const documents = await storage.getClientDocuments(req.params.clientId);
        const doc = documents.find(
          (d) => d.document_type === req.params.documentType,
        );

        if (!doc) {
          return res.status(404).json({ error: "Document not found" });
        }

        // Use object storage service to stream the file with proper authentication
        const objectFile = await objectStorageService.getObjectEntityFile(
          doc.object_path,
        );

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
    },
  );

  // Job sample routes
  app.get(
    "/api/clients/:clientId/job-samples",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const samples = await storage.getJobSamples(req.params.clientId);
        res.json(samples);
      } catch (error) {
        console.error("Error fetching job samples:", error);
        res.status(500).json({ error: "Failed to fetch job samples" });
      }
    },
  );

  app.post(
    "/api/clients/:clientId/job-samples",
    isSupabaseAuthenticated,
    async (req, res) => {
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
    },
  );

  app.post(
    "/api/clients/:clientId/job-samples/bulk",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const { urls } = req.body;
        if (!Array.isArray(urls)) {
          return res.status(400).json({ error: "urls must be an array" });
        }

        const samples = [];
        for (const url of urls) {
          if (typeof url !== "string" || !url.trim()) continue;

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
    },
  );

  app.patch(
    "/api/job-samples/:id",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const validatedData = updateJobCriteriaSampleSchema.parse(req.body);
        const sample = await storage.updateJobSample(
          req.params.id,
          validatedData,
        );
        if (!sample) {
          return res.status(404).json({ error: "Job sample not found" });
        }
        res.json(sample);
      } catch (error: any) {
        console.error("Error updating job sample:", error);
        if (error?.name === "ZodError") {
          return res
            .status(400)
            .json({ error: "Invalid update data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update job sample" });
      }
    },
  );

  app.delete(
    "/api/job-samples/:id",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        await storage.deleteJobSample(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting job sample:", error);
        res.status(500).json({ error: "Failed to delete job sample" });
      }
    },
  );

  app.post(
    "/api/job-samples/:id/scrape",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        if (!process.env.APIFY_API_TOKEN) {
          return res.status(500).json({
            error:
              "Apify API token not configured. Please add APIFY_API_TOKEN to environment secrets.",
          });
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
        res.status(500).json({
          error: "Failed to scrape job sample. Check server logs for details.",
        });
      }
    },
  );

  // Client job response routes
  app.get(
    "/api/clients/:clientId/job-responses",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const responses = await storage.getJobResponses(req.params.clientId);
        res.json(responses);
      } catch (error) {
        console.error("Error fetching job responses:", error);
        res.status(500).json({ error: "Failed to fetch job responses" });
      }
    },
  );

  app.post(
    "/api/clients/:clientId/job-responses",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const validatedData = insertClientJobResponseSchema.parse({
          ...req.body,
          client_id: req.params.clientId,
        });

        if (validatedData.verdict === "no" && !validatedData.comment?.trim()) {
          return res
            .status(400)
            .json({ error: "Comment is required when verdict is 'no'" });
        }

        const response = await storage.createJobResponse(validatedData);
        res.status(201).json(response);
      } catch (error) {
        console.error("Error creating job response:", error);
        res.status(400).json({ error: "Failed to create job response" });
      }
    },
  );

  // ========================================
  // APPLIER STATS ROUTES
  // ========================================

  // Get applier dashboard stats
  app.get(
    "/api/applier-stats/:applierId",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const applierId = req.params.applierId;

        // Get today's date range (UTC)
        const now = new Date();
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).toISOString();
        const endOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        ).toISOString();

        // Get start of week (Sunday)
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - dayOfWeek,
        ).toISOString();

        // Get all applications for this applier
        const allApps = await storage.getApplicationsByApplier(applierId);

        // Filter today's applications
        const todayApps = allApps.filter((app) => {
          const appDate = new Date(
            app.applied_at || app.applied_date || app.created_at || "",
          );
          return (
            appDate >= new Date(startOfDay) && appDate < new Date(endOfDay)
          );
        });

        // Filter this week's applications
        const weekApps = allApps.filter((app) => {
          const appDate = new Date(
            app.applied_at || app.applied_date || app.created_at || "",
          );
          return appDate >= new Date(startOfWeek);
        });

        // Get today's sessions for time tracking
        const allSessions = await storage.getApplierSessions(applierId);
        const todaySessions = allSessions.filter((s) => {
          const sessionDate = new Date(s.started_at || s.created_at || "");
          return (
            sessionDate >= new Date(startOfDay) &&
            sessionDate < new Date(endOfDay)
          );
        });

        // Calculate time worked today (from completed sessions)
        const completedSessions = todaySessions.filter(
          (s) => s.status === "applied",
        );
        const totalSeconds = completedSessions.reduce(
          (sum, s) => sum + (s.duration_seconds || 0),
          0,
        );
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const timeWorked = `${hours}:${mins.toString().padStart(2, "0")}`;

        // Calculate average time per app
        const avgSeconds =
          todayApps.length > 0
            ? Math.round(totalSeconds / todayApps.length)
            : 0;
        const avgMins = Math.floor(avgSeconds / 60);
        const avgSecs = avgSeconds % 60;
        const avgTimePerApp =
          todayApps.length > 0
            ? `${avgMins}:${avgSecs.toString().padStart(2, "0")}`
            : "-";

        // Get jobs waiting in queue for this applier's assigned clients
        const applier = await storage.getApplier(applierId);
        let jobsWaiting = 0;
        if (applier?.assigned_client_ids?.length) {
          const jobs = await storage.getJobs();
          // Filter jobs for assigned clients that haven't been applied to yet
          const appliedJobIds = new Set(allApps.map((a) => a.job_id));
          const flaggedSessionIds = new Set(
            allSessions
              .filter((s) => s.status === "flagged")
              .map((s) => s.job_id),
          );

          jobsWaiting = jobs.filter(
            (j) =>
              applier.assigned_client_ids?.includes(j.client_id) &&
              !appliedJobIds.has(j.id) &&
              !flaggedSessionIds.has(j.id) &&
              j.status === "active",
          ).length;
        }

        // Calculate projected finish time (remaining apps * avg time)
        const dailyGoal = 100; // Standard daily goal per applier
        const remaining = Math.max(0, dailyGoal - todayApps.length);
        let projectedFinish = "-";
        if (remaining > 0 && avgSeconds > 0) {
          const remainingSeconds = remaining * avgSeconds;
          const finishHours = Math.floor(remainingSeconds / 3600);
          const finishMins = Math.floor((remainingSeconds % 3600) / 60);
          projectedFinish =
            finishHours > 0
              ? `${finishHours}h ${finishMins}m`
              : `${finishMins}m`;
        } else if (remaining === 0) {
          projectedFinish = "Done!";
        }

        // Calculate interview rate (apps with interviews / total apps)
        const interviewApps = allApps.filter(
          (a) => a.status === "interview" || a.status === "Interview",
        );
        const interviewRate =
          allApps.length > 0
            ? Math.round((interviewApps.length / allApps.length) * 100)
            : 0;

        // Calculate QA error rate (apps with qa_status = Rejected / total apps)
        const qaRejected = allApps.filter((a) => a.qa_status === "Rejected");
        const qaErrorRate =
          allApps.length > 0
            ? Math.round((qaRejected.length / allApps.length) * 100)
            : 0;

        // Get actual earnings from database for this week
        const weekStartDate = new Date(startOfWeek).toISOString().split("T")[0];
        const todayDate = now.toISOString().split("T")[0];
        const weekEarnings = await storage.getApplierEarningsByDateRange(
          applierId,
          weekStartDate,
          todayDate,
        );
        const weeklyEarningsTotal = weekEarnings.reduce(
          (sum, e) => sum + Number(e.amount),
          0,
        );

        // Get today's earnings
        const todaysEarnings = weekEarnings.filter(
          (e) => e.earned_date === todayDate,
        );
        const dailyEarnings = todaysEarnings.reduce(
          (sum, e) => sum + Number(e.amount),
          0,
        );

        // Calculate base pay estimate: $7/hr * hours worked today
        const hoursWorkedDecimal = totalSeconds / 3600;
        const estimatedBasePay = Math.round(hoursWorkedDecimal * 7 * 100) / 100;

        res.json({
          dailyApps: todayApps.length,
          dailyGoal,
          timeWorked,
          avgTimePerApp,
          projectedFinish,
          weeklyApps: weekApps.length,
          weeklyEarnings: weeklyEarningsTotal,
          dailyEarnings,
          estimatedBasePay,
          interviewRate,
          qaErrorRate,
          jobsWaiting,
          totalApps: allApps.length,
        });
      } catch (error) {
        console.error("Error fetching applier stats:", error);
        res.status(500).json({ error: "Failed to fetch applier stats" });
      }
    },
  );

  // ========================================
  // APPLIER JOB SESSION ROUTES
  // ========================================

  // Get applier's sessions
  app.get(
    "/api/applier-sessions",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const { applier_id } = req.query;

        if (!applier_id) {
          return res
            .status(400)
            .json({ error: "applier_id query parameter required" });
        }

        const sessions = await storage.getApplierSessions(applier_id as string);
        res.json(sessions);
      } catch (error) {
        console.error("Error fetching applier sessions:", error);
        res.status(500).json({ error: "Failed to fetch applier sessions" });
      }
    },
  );

  // Start review - creates session with in_progress status and records start time
  app.post(
    "/api/applier-sessions/start-review",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const { job_id, applier_id } = req.body;

        if (!job_id || !applier_id) {
          return res
            .status(400)
            .json({ error: "job_id and applier_id are required" });
        }

        // Check if session already exists for this job/applier
        const existingSession = await storage.getApplierSessionByJob(
          job_id,
          applier_id,
        );

        if (existingSession) {
          // Update existing session to in_progress with new start time
          const updated = await storage.updateApplierSession(
            existingSession.id,
            {
              status: "in_progress",
              started_at: new Date().toISOString(),
            },
          );
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
    },
  );

  // Mark applied - updates session, creates application record
  app.post(
    "/api/applier-sessions/:sessionId/applied",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const session = await storage.getApplierSession(req.params.sessionId);

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        if (session.status !== "in_progress") {
          return res
            .status(400)
            .json({ error: "Can only mark applied for in_progress sessions" });
        }

        const completedAt = new Date();
        const startedAt = session.started_at
          ? new Date(session.started_at)
          : completedAt;
        const durationSeconds = Math.floor(
          (completedAt.getTime() - startedAt.getTime()) / 1000,
        );

        // Update session to applied
        const updatedSession = await storage.updateApplierSession(
          req.params.sessionId,
          {
            status: "applied",
            completed_at: completedAt.toISOString(),
            duration_seconds: durationSeconds,
          },
        );

        // Create application record (client_id comes from joined job data)
        const clientId = session.job?.client_id;
        if (!clientId) {
          return res
            .status(400)
            .json({ error: "Job has no associated client" });
        }

        // Get job details from session for the application snapshot
        const job = session.job as any;

        const application = await storage.createApplication({
          job_id: session.job_id,
          applier_id: session.applier_id,
          client_id: clientId,
          status: "applied",
          applied_date: completedAt.toISOString(),
          duration_seconds: durationSeconds,
          // Job snapshot fields (NOT NULL in Supabase)
          job_title: job?.job_title || job?.title || "Unknown Position",
          company_name: job?.company_name || job?.company || "Unknown Company",
          job_url: job?.job_url || job?.url || "",
          feed_job_id: job?.feed_job_id || null,
          feed_source: job?.feed_source || "manual",
        });
        // Create base pay earning ($0.28 per application)
        try {
          await storage.createApplierEarning({
            applier_id: session.applier_id,
            client_id: clientId,
            earnings_type: "base_pay",
            amount: 0.28,
            earned_date: new Date().toISOString().split("T")[0],
            payment_status: "pending",
            notes: `Base pay for ${application.job_title} at ${application.company_name}`,
          });
          console.log(
            `[Earnings] Base pay $0.28 for ${application.company_name}`,
          );
        } catch (basePayError) {
          console.error("Error creating base pay:", basePayError);
          // Don't fail the application if base pay fails
        }
        // If this job came from the feed, notify the feed API
        if (job?.feed_job_id && job?.feed_source === "feed") {
          try {
            const { markJobAppliedInFeed } = await import("./jobFeedSync");
            await markJobAppliedInFeed(clientId, job.feed_job_id);
            console.log(
              `[Feed] Marked job ${job.feed_job_id} as applied in feed for client ${clientId}`,
            );
          } catch (feedError) {
            console.error(
              `[Feed] Failed to mark job as applied in feed:`,
              feedError,
            );
            // Don't fail the application if feed notification fails
          }
        }

        // Check for 100 application milestone bonus
        try {
          const today = new Date().toISOString().split("T")[0];
          const applications = await storage.getApplicationsByApplier(
            session.applier_id,
          );
          const todaysApps = applications.filter((a) => {
            const appDate = new Date(a.applied_date || a.created_at || "")
              .toISOString()
              .split("T")[0];
            return appDate === today;
          });

          // Check if applier has reached 100 apps today AND hasn't already received the bonus
          if (todaysApps.length >= 100) {
            const existingEarnings = await storage.getApplierEarnings(
              session.applier_id,
            );
            const existingMilestoneToday = existingEarnings.find(
              (e) =>
                e.earnings_type === "application_milestone" &&
                e.earned_date === today &&
                e.application_count === 100,
            );

            // Only create bonus if not already awarded today
            if (!existingMilestoneToday && todaysApps.length === 100) {
              await storage.createApplierEarning({
                applier_id: session.applier_id,
                client_id: clientId,
                earnings_type: "application_milestone",
                amount: 25,
                application_count: 100,
                earned_date: today,
                payment_status: "pending",
                notes: `100 application milestone reached for ${application.job_title}`,
              });
            }
          }
        } catch (bonusError) {
          console.error("Error checking milestone bonus:", bonusError);
          // Don't fail the application if bonus check fails
        }

        res.json({ session: updatedSession, application });
      } catch (error) {
        console.error("Error marking session as applied:", error);
        res.status(500).json({ error: "Failed to mark as applied" });
      }
    },
  );

  // Flag job - creates flagged application for admin review
  app.post(
    "/api/applier-sessions/:sessionId/flag",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const { comment } = req.body;

        if (!comment?.trim()) {
          return res
            .status(400)
            .json({ error: "Comment is required when flagging a job" });
        }

        const session = await storage.getApplierSession(req.params.sessionId);

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        if (session.status === "flagged") {
          return res.status(400).json({ error: "Job is already flagged" });
        }

        if (session.status === "applied") {
          return res
            .status(400)
            .json({ error: "Cannot flag an already applied job" });
        }

        // Update session to flagged
        const updatedSession = await storage.updateApplierSession(
          req.params.sessionId,
          {
            status: "flagged",
            flag_comment: comment.trim(),
          },
        );

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
    },
  );

  // ========================================
  // FLAGGED APPLICATIONS ROUTES (Admin)
  // ========================================

  app.get(
    "/api/flagged-applications",
    isSupabaseAuthenticated,
    async (req, res) => {
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
    },
  );

  app.patch(
    "/api/flagged-applications/:id",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const validatedData = updateFlaggedApplicationSchema.parse(req.body);

        // Auto-set resolved_at when status changes to resolved
        if (validatedData.status === "resolved" && !validatedData.resolved_at) {
          validatedData.resolved_at = new Date().toISOString();
        }

        const updated = await storage.updateFlaggedApplication(
          req.params.id,
          validatedData,
        );
        if (!updated) {
          return res
            .status(404)
            .json({ error: "Flagged application not found" });
        }
        res.json(updated);
      } catch (error) {
        console.error("Error updating flagged application:", error);
        res.status(400).json({ error: "Failed to update flagged application" });
      }
    },
  );

  // Get all clients with their job criteria (for search app)
  app.get("/api/external/clients", validateExternalApiKey, async (req, res) => {
    try {
      const clients = await storage.getClients();
      // Return only job criteria fields (no sensitive data)
      const clientCriteria = clients.map((c) => ({
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
        job_criteria_signoff: c.job_criteria_signoff,
      }));
      res.json(clientCriteria);
    } catch (error) {
      console.error("Error fetching clients for external API:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Get single client job criteria (for search app)
  app.get(
    "/api/external/clients/:id/job-criteria",
    validateExternalApiKey,
    async (req, res) => {
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
          job_criteria_signoff: client.job_criteria_signoff,
        });
      } catch (error) {
        console.error("Error fetching client for external API:", error);
        res.status(500).json({ error: "Failed to fetch client" });
      }
    },
  );

  // ========================================
  // APPLIER EARNINGS ROUTES
  // ========================================

  // Get earnings for an applier
  app.get(
    "/api/appliers/:applierId/earnings",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const { start_date, end_date } = req.query;

        let earnings;
        if (start_date && end_date) {
          earnings = await storage.getApplierEarningsByDateRange(
            req.params.applierId,
            start_date as string,
            end_date as string,
          );
        } else {
          earnings = await storage.getApplierEarnings(req.params.applierId);
        }

        res.json(earnings);
      } catch (error) {
        console.error("Error fetching applier earnings:", error);
        res.status(500).json({ error: "Failed to fetch applier earnings" });
      }
    },
  );

  // Get all earnings (admin view)
  app.get("/api/earnings", isSupabaseAuthenticated, async (req, res) => {
    try {
      const { client_id } = req.query;

      let earnings;
      if (client_id) {
        earnings = await storage.getEarningsByClient(client_id as string);
      } else {
        earnings = await storage.getAllEarnings();
      }

      res.json(earnings);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });

  // Create a new earning record
  app.post("/api/earnings", isSupabaseAuthenticated, async (req, res) => {
    try {
      const { insertApplierEarningSchema } = await import("@shared/schema");
      const validatedData = insertApplierEarningSchema.parse(req.body);
      const earning = await storage.createApplierEarning(validatedData);
      res.status(201).json(earning);
    } catch (error) {
      console.error("Error creating earning:", error);
      res.status(400).json({ error: "Failed to create earning" });
    }
  });

  // Update earning (mark as approved/paid)
  app.patch("/api/earnings/:id", isSupabaseAuthenticated, async (req, res) => {
    try {
      const { updateApplierEarningSchema } = await import("@shared/schema");
      const validatedData = updateApplierEarningSchema.parse(req.body);

      // Auto-set paid_date when status changes to paid
      if (validatedData.payment_status === "paid" && !validatedData.paid_date) {
        validatedData.paid_date = new Date().toISOString().split("T")[0];
      }

      const updated = await storage.updateApplierEarning(
        req.params.id,
        validatedData,
      );
      if (!updated) {
        return res.status(404).json({ error: "Earning not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating earning:", error);
      res.status(400).json({ error: "Failed to update earning" });
    }
  });

  // Admin client performance - real client stats
  app.get(
    "/api/admin/client-performance",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const clients = await storage.getClients();
        const allApplications = await storage.getApplications();
        const allInterviews = await storage.getInterviews();
        const allEarnings = await storage.getAllEarnings();

        const clientPerformance = clients.map((client) => {
          // Count applications for this client
          const clientApps = allApplications.filter(
            (a) => a.client_id === client.id,
          );
          const totalApps = clientApps.length;

          // Count interviews for this client
          const clientInterviews = allInterviews.filter(
            (i) => i.client_id === client.id,
          );
          const interviews = clientInterviews.length;

          // Offers = client is placed (status === 'placed')
          const offers = client.status === "placed" ? 1 : 0;

          // Total spend = sum of earnings for this client
          const clientEarnings = allEarnings.filter(
            (e) => e.client_id === client.id,
          );
          const spend = clientEarnings.reduce(
            (sum, e) => sum + Number(e.amount),
            0,
          );

          // Calculate last activity
          let lastActivity = "Never";
          if (client.last_application_date) {
            const lastDate = new Date(client.last_application_date);
            const now = new Date();
            const diffMs = now.getTime() - lastDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 60) lastActivity = `${diffMins}m ago`;
            else if (diffMins < 1440)
              lastActivity = `${Math.floor(diffMins / 60)}h ago`;
            else lastActivity = `${Math.floor(diffMins / 1440)}d ago`;
          }

          // Start date
          const startDate = client.first_application_date
            ? new Date(client.first_application_date).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              )
            : client.created_at
              ? new Date(client.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Not started";

          return {
            id: client.id,
            name: `${client.first_name} ${client.last_name}`,
            status: client.status,
            startDate,
            lastActivity,
            totalApps,
            interviews,
            offers,
            spend,
          };
        });

        res.json(clientPerformance);
      } catch (error) {
        console.error("Error fetching client performance:", error);
        res.status(500).json({ error: "Failed to fetch client performance" });
      }
    },
  );

  // Admin overview stats - real applier performance data
  app.get("/api/admin/overview", isSupabaseAuthenticated, async (req, res) => {
    try {
      const appliers = await storage.getAppliers();
      const allApplications = await storage.getApplications();

      // Get date boundaries
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(
        now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
      ); // Monday
      startOfWeek.setHours(0, 0, 0, 0);
      const weekStartDate = startOfWeek.toISOString().split("T")[0];

      const DAILY_GOAL = 100;
      const WEEKLY_GOAL = 500;

      // Calculate per-applier stats
      const applierStats = await Promise.all(
        appliers.map(async (applier) => {
          const applierApps = allApplications.filter(
            (a) => a.applier_id === applier.id,
          );

          // Today's apps
          const todayApps = applierApps.filter((a) => {
            const appDate = new Date(a.applied_date || a.created_at || "")
              .toISOString()
              .split("T")[0];
            return appDate === today;
          });

          // This week's apps
          const weekApps = applierApps.filter((a) => {
            const appDate = new Date(a.applied_date || a.created_at || "");
            return appDate >= startOfWeek;
          });

          // Calculate QA Score (100% - rejection rate)
          const qaRejected = applierApps.filter(
            (a) => a.qa_status === "Rejected",
          ).length;
          const qaScore =
            applierApps.length > 0
              ? Math.round(
                  ((applierApps.length - qaRejected) / applierApps.length) *
                    100,
                )
              : 100;

          // Calculate interview rate
          const interviewApps = applierApps.filter(
            (a) => a.status?.toLowerCase() === "interview",
          ).length;
          const interviewRate =
            applierApps.length > 0
              ? Math.round((interviewApps / applierApps.length) * 1000) / 10
              : 0;

          // Calculate last activity time
          let lastActive = "Never";
          if (applier.last_activity_at) {
            const lastActivity = new Date(applier.last_activity_at);
            const diffMs = now.getTime() - lastActivity.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) lastActive = "Now";
            else if (diffMins < 60) lastActive = `${diffMins}m ago`;
            else if (diffMins < 1440)
              lastActive = `${Math.floor(diffMins / 60)}h ago`;
            else lastActive = `${Math.floor(diffMins / 1440)}d ago`;
          }

          return {
            id: applier.id,
            name: `${applier.first_name} ${applier.last_name}`,
            email: applier.email,
            status:
              applier.status === "active"
                ? "Active"
                : applier.status === "idle"
                  ? "Idle"
                  : applier.status === "inactive"
                    ? "Inactive"
                    : "Offline",
            lastActive,
            dailyApps: todayApps.length,
            dailyGoal: DAILY_GOAL,
            weeklyApps: weekApps.length,
            weeklyGoal: WEEKLY_GOAL,
            qaScore,
            interviewRate,
            totalApps: applierApps.length,
          };
        }),
      );

      // Calculate aggregate stats
      const totalDailyApps = applierStats.reduce(
        (sum, a) => sum + a.dailyApps,
        0,
      );
      const totalWeeklyApps = applierStats.reduce(
        (sum, a) => sum + a.weeklyApps,
        0,
      );
      const activeReviewers = applierStats.filter(
        (a) => a.status === "Active",
      ).length;
      const avgQaScore =
        applierStats.length > 0
          ? Math.round(
              applierStats.reduce((sum, a) => sum + a.qaScore, 0) /
                applierStats.length,
            )
          : 0;

      res.json({
        summary: {
          totalDailyApps,
          totalWeeklyApps,
          activeReviewers,
          totalAppliers: appliers.length,
          avgQaScore,
        },
        appliers: applierStats,
      });
    } catch (error) {
      console.error("Error fetching admin overview:", error);
      res.status(500).json({ error: "Failed to fetch admin overview" });
    }
  });

  // Get earnings summary per client (for admin cost tracking)
  app.get(
    "/api/admin/client-costs",
    isSupabaseAuthenticated,
    async (req, res) => {
      try {
        const clients = await storage.getClients();
        const allEarnings = await storage.getAllEarnings();

        const clientCosts = clients.map((client) => {
          const clientEarnings = allEarnings.filter(
            (e) => e.client_id === client.id,
          );
          const totalCost = clientEarnings.reduce(
            (sum, e) => sum + Number(e.amount),
            0,
          );
          const paidAmount = clientEarnings
            .filter((e) => e.payment_status === "paid")
            .reduce((sum, e) => sum + Number(e.amount), 0);
          const pendingAmount = clientEarnings
            .filter((e) => e.payment_status === "pending")
            .reduce((sum, e) => sum + Number(e.amount), 0);

          return {
            client_id: client.id,
            client_name: `${client.first_name} ${client.last_name}`,
            total_cost: totalCost,
            paid_amount: paidAmount,
            pending_amount: pendingAmount,
            earnings_breakdown: {
              application_milestone: clientEarnings
                .filter((e) => e.earnings_type === "application_milestone")
                .reduce((sum, e) => sum + Number(e.amount), 0),
              interview_bonus: clientEarnings
                .filter((e) => e.earnings_type === "interview_bonus")
                .reduce((sum, e) => sum + Number(e.amount), 0),
              placement_bonus: clientEarnings
                .filter((e) => e.earnings_type === "placement_bonus")
                .reduce((sum, e) => sum + Number(e.amount), 0),
            },
          };
        });

        res.json(clientCosts);
      } catch (error) {
        console.error("Error fetching client costs:", error);
        res.status(500).json({ error: "Failed to fetch client costs" });
      }
    },
  );

  // ClientGPT - proxy to Supabase edge function
  app.post("/api/client-chat", isSupabaseAuthenticated, async (req, res) => {
    try {
      const { applier_id, question } = req.body;

      if (!applier_id || !question) {
        return res
          .status(400)
          .json({ error: "applier_id and question are required" });
      }

      const apiUrl = process.env.CLIENT_CHAT_API_URL;
      const apiKey = process.env.CLIENT_CHAT_API_KEY;

      if (!apiUrl || !apiKey) {
        return res.status(500).json({ error: "ClientGPT not configured" });
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applier_id, question }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ClientGPT API error:", errorText);
        return res
          .status(response.status)
          .json({ error: "Failed to get answer" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("ClientGPT error:", error);
      res.status(500).json({ error: "Failed to process question" });
    }
  });
  // Resume Tailor - AI-powered keyword gap analysis for appliers
  app.post("/api/resume-tailor", isSupabaseAuthenticated, async (req, res) => {
    try {
      const { client_id, job_description } = req.body;

      if (!client_id || !job_description) {
        return res
          .status(400)
          .json({ error: "client_id and job_description are required" });
      }

      const client = await storage.getClient(client_id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const resumeText = client.resume_text || "";
      const onboardingTranscript = client.onboarding_transcript || "";

      if (!resumeText) {
        return res.status(400).json({
          error:
            "Client has no resume text. Please add resume_text to the client record.",
        });
      }

      const prompt = `You are a resume tailoring assistant. Your job is to analyze keyword coverage and suggest targeted edits to improve job match rate.

  ## Key Research Insights You Must Apply:
  - ATS systems are searchable databases, not gatekeepers. Recruiters make all decisions.
  - Recruiters spend 6-30 seconds on initial scan - top of resume matters most.
  - Target 60-80% keyword coverage (15-25 relevant terms). NOT 100% - that looks like stuffing.
  - Modern ATS uses semantic matching: "collaborated" matches "collaboration" - don't stress exact phrasing.

  ## Client's Resume:
  ${resumeText}

  ${
    onboardingTranscript
      ? `## Career Context:
  ${onboardingTranscript}`
      : ""
  }

  ## Job Description:
  ${job_description}

  ## Your Task:

  ### 1. Keyword Gap Analysis
  Extract 15-25 high-value keywords/phrases from the job description (technical skills, tools, methodologies, soft skills). Then assess which ones are:
  - ✓ Already covered (present in resume, even if phrased differently - remember semantic matching)
  - ✗ Missing (should be added if client can legitimately claim them)

  Show the approximate coverage percentage.

  ### 2. Prioritized Suggestions
  Focus ONLY on high-impact, quick changes:

  **Skills Section:** List specific keywords to add. But only list 4 MAX of the most relevant ones. We dont have that much room. If you are to add additional ones tell them which ones to remove to make room. 

  **Summary:** If the summary doesn't reflect the JD's emphasis, suggest a brief reframe. Keep the client's voice. But make sure that it is still readable dont just shoehorn in keywords that makes it jibberish. 

  **Title Alignment:** Only if there's an obvious mismatch between client's titles and JD language (e.g., "Software Developer" vs "Software Engineer").
  - Word swaps in bullets OK (e.g., "built pipelines" → "built ETL pipelines")
  
  ### 3. What NOT to Change
  - Don't suggest bullet point reordering or adding in new bullet points(diminishing returns)
  - Don't suggest changes just to hit 100% - 60-80% is the sweet spot
  - Never suggest adding skills the client can't legitimately claim
  - Don't rewrite content that's already working

  ## Output Format:

  **Keyword Coverage: ~X%** (X of Y key terms found)

  **Missing High-Value Keywords:**
  [List only the important ones worth adding]

  **Quick Wins:**
  [2-5 specific, actionable suggestions - be direct, skip fluff]

  Keep the entire response scannable and actionable. The applier should be able to execute these changes in 2-3 minutes.`;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Claude API not configured" });
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Claude API error:", errorText);
        return res
          .status(500)
          .json({ error: "Failed to get suggestions from AI" });
      }

      const data = await response.json();
      const suggestions =
        data.content?.[0]?.text || "No suggestions generated.";

      res.json({
        suggestions,
        client_name: `${client.first_name} ${client.last_name}`,
      });
    } catch (error) {
      console.error("Resume tailor error:", error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  return httpServer;
}
