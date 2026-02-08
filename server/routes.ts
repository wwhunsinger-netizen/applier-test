import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertTestSubmissionSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ========================================
  // TEST SUBMISSIONS (Applier Assessment V2)
  // No auth required - test takers aren't logged in
  // ========================================

  // Check if email has already taken the test
  app.get("/api/test-submissions/check-email", async (req, res) => {
    try {
      const email = (req.query.email as string || "").toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }
      const existing = await storage.getTestSubmissionByEmail(email);
      res.json({ taken: !!existing });
    } catch (error) {
      console.error("Error checking email:", error);
      res.status(500).json({ error: "Failed to check email" });
    }
  });

  // Submit test results
  app.post("/api/test-submissions", async (req, res) => {
    try {
      const parsed = insertTestSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid submission data", details: parsed.error.flatten() });
      }

      // Block duplicate submissions entirely (one attempt per email)
      const existing = await storage.getTestSubmissionByEmail(parsed.data.candidate_email);
      if (existing) {
        return res.json({ id: existing.id, duplicate: true });
      }

      const submission = await storage.createTestSubmission({
        ...parsed.data,
        candidate_email: parsed.data.candidate_email.toLowerCase().trim(),
      });
      res.json(submission);
    } catch (error) {
      console.error("Error creating test submission:", error);
      res.status(500).json({ error: "Failed to save test submission" });
    }
  });

  return httpServer;
}
