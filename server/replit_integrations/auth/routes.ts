import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const sessionUser = req.user;
      
      // Handle password-based auth sessions
      if (sessionUser.auth_type === "password") {
        res.json({
          id: sessionUser.id,
          email: sessionUser.email,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
        });
        return;
      }
      
      // Handle OAuth sessions
      const userId = sessionUser.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
