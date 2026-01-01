import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import type { ApplierStatus } from "@shared/schema";

const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

interface ConnectedApplier {
  ws: WebSocket;
  applierId: string;
  lastActivity: number;
  idleTimer: NodeJS.Timeout | null;
}

class PresenceService {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, ConnectedApplier> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws/presence" });

    this.wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const applierId = url.searchParams.get("applierId");

      if (!applierId) {
        ws.close(4001, "Missing applierId");
        return;
      }

      console.log(`[presence] Applier ${applierId} connected`);
      this.handleConnection(ws, applierId);
    });

    this.startHeartbeatCheck();
    console.log("[presence] WebSocket presence service initialized");
  }

  private async handleConnection(ws: WebSocket, applierId: string) {
    const existingConnection = this.connections.get(applierId);
    if (existingConnection) {
      existingConnection.ws.close(4002, "New connection opened");
      if (existingConnection.idleTimer) {
        clearTimeout(existingConnection.idleTimer);
      }
    }

    const connection: ConnectedApplier = {
      ws,
      applierId,
      lastActivity: Date.now(),
      idleTimer: null,
    };

    this.connections.set(applierId, connection);
    await this.updateStatus(applierId, "active");
    this.resetIdleTimer(applierId);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "activity" || message.type === "heartbeat") {
          connection.lastActivity = Date.now();
          
          const applier = await storage.getApplier(applierId);
          if (applier && applier.status === "idle") {
            await this.updateStatus(applierId, "active");
          }
          
          this.resetIdleTimer(applierId);
          
          ws.send(JSON.stringify({ type: "ack", timestamp: Date.now() }));
        }
      } catch (err) {
        console.error("[presence] Error processing message:", err);
      }
    });

    ws.on("close", async () => {
      console.log(`[presence] Applier ${applierId} disconnected`);
      const conn = this.connections.get(applierId);
      if (conn && conn.idleTimer) {
        clearTimeout(conn.idleTimer);
      }
      this.connections.delete(applierId);
      
      const applier = await storage.getApplier(applierId);
      if (applier && applier.status !== "inactive") {
        await this.updateStatus(applierId, "offline");
      }
    });

    ws.on("error", (err) => {
      console.error(`[presence] WebSocket error for ${applierId}:`, err);
    });
  }

  private resetIdleTimer(applierId: string) {
    const connection = this.connections.get(applierId);
    if (!connection) return;

    if (connection.idleTimer) {
      clearTimeout(connection.idleTimer);
    }

    connection.idleTimer = setTimeout(async () => {
      const applier = await storage.getApplier(applierId);
      if (applier && applier.status === "active") {
        console.log(`[presence] Applier ${applierId} idle (no activity for ${IDLE_TIMEOUT_MS / 1000}s)`);
        await this.updateStatus(applierId, "idle");
      }
    }, IDLE_TIMEOUT_MS);
  }

  private async updateStatus(applierId: string, status: ApplierStatus) {
    try {
      await storage.updateApplier(applierId, { 
        status,
        last_activity_at: new Date().toISOString()
      });
      console.log(`[presence] Updated ${applierId} status to ${status}`);
      
      this.broadcastStatusChange(applierId, status);
    } catch (err) {
      console.error(`[presence] Failed to update status for ${applierId}:`, err);
    }
  }

  private broadcastStatusChange(applierId: string, status: ApplierStatus) {
    const message = JSON.stringify({
      type: "status_change",
      applierId,
      status,
      timestamp: Date.now()
    });

    this.connections.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    });
  }

  private startHeartbeatCheck() {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((conn, applierId) => {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.ping();
        } else {
          this.connections.delete(applierId);
        }
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  getConnectedAppliers(): string[] {
    return Array.from(this.connections.keys());
  }

  isApplierConnected(applierId: string): boolean {
    return this.connections.has(applierId);
  }
}

export const presenceService = new PresenceService();
