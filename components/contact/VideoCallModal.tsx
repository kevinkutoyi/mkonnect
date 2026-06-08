// components/contact/VideoCallModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
  profileId: string;
  type: "video" | "audio";
  onClose: () => void;
}

export function VideoCallModal({ profileId, type, onClose }: Props) {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/calls/room", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ profileId, type }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.url) setRoomUrl(d.url);
        else setError(d.error ?? "Could not start call");
      })
      .catch(() => setError("Network error. Try again."));
  }, [profileId, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-black shadow-2xl"
           style={{ height: "min(80vh, 640px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-semibold text-white">
            {type === "video" ? "📹 Video Call" : "📞 Audio Call"}
          </span>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center">
          {error ? (
            <div className="text-center">
              <p className="text-red-400">{error}</p>
              {error.includes("not configured") && (
                <p className="mt-2 text-xs text-white/40">
                  Add DAILY_API_KEY to .env to enable calls.
                </p>
              )}
            </div>
          ) : roomUrl ? (
            <iframe
              src={`${roomUrl}?${type === "audio" ? "startVideoOff=true" : ""}`}
              allow="camera; microphone; fullscreen; display-capture"
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Starting {type} call…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
