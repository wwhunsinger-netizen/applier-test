import type { RequestHandler } from "express";
import { supabase } from "./supabase";

export const isSupabaseAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    
    (req as any).supabaseUser = user;
    next();
  } catch (error) {
    console.error("[supabase-auth] Error verifying token:", error);
    return res.status(401).json({ message: "Unauthorized - Token verification failed" });
  }
};
