import { useEffect, useRef, useCallback } from "react";

const ACTIVITY_PING_INTERVAL_MS = 60 * 1000; // Send heartbeat every 60 seconds
const RECONNECT_DELAY_MS = 5000; // Wait 5 seconds before reconnecting

interface UsePresenceOptions {
  applierId: string | null;
  enabled?: boolean;
}

export function usePresence({ applierId, enabled = true }: UsePresenceOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const connect = useCallback(() => {
    if (!applierId || !enabled) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/presence?applierId=${applierId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[presence] Connected to presence service");
        sendActivity();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "ack") {
            // Heartbeat acknowledged
          } else if (message.type === "status_change") {
            // Could dispatch event for real-time UI updates
            console.log(`[presence] Status changed: ${message.applierId} -> ${message.status}`);
          }
        } catch (err) {
          console.error("[presence] Error parsing message:", err);
        }
      };

      ws.onclose = () => {
        console.log("[presence] Disconnected from presence service");
        wsRef.current = null;
        
        // Attempt reconnection
        if (enabled && applierId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[presence] Attempting reconnection...");
            connect();
          }, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = (err) => {
        console.error("[presence] WebSocket error:", err);
      };
    } catch (err) {
      console.error("[presence] Failed to create WebSocket:", err);
    }
  }, [applierId, enabled]);

  const sendActivity = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "activity", timestamp: Date.now() }));
      lastActivityRef.current = Date.now();
    }
  }, []);

  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "heartbeat", timestamp: Date.now() }));
    }
  }, []);

  // Track user activity (mouse, keyboard, touch)
  useEffect(() => {
    if (!enabled || !applierId) return;

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    let activityTimeout: NodeJS.Timeout | null = null;

    const handleActivity = () => {
      // Debounce activity pings to avoid flooding
      if (activityTimeout) return;
      
      sendActivity();
      
      activityTimeout = setTimeout(() => {
        activityTimeout = null;
      }, 5000); // Only send activity once per 5 seconds max
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimeout) clearTimeout(activityTimeout);
    };
  }, [enabled, applierId, sendActivity]);

  // Connect and setup heartbeat
  useEffect(() => {
    if (!enabled || !applierId) {
      // Cleanup if disabled
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    connect();

    // Send heartbeats periodically
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, ACTIVITY_PING_INTERVAL_MS);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [applierId, enabled, connect, sendHeartbeat]);

  return {
    sendActivity,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
