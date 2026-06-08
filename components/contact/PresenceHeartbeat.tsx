// components/contact/PresenceHeartbeat.tsx
"use client";
import { useEffect } from "react";

// Mounted once in the layout for logged-in users.
// Pings /api/presence/heartbeat every 30s to keep isOnline = true.
export function PresenceHeartbeat() {
  useEffect(() => {
    const ping = () => fetch("/api/presence/heartbeat", { method: "POST" });
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
