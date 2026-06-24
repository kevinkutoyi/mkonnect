"use client";
// components/videos/VideoManager.tsx — model dashboard for managing premium videos

import { useState, useRef } from "react";
import { Trash2, Loader2, Plus, Video, Lock } from "lucide-react";

interface PremiumVideo {
  id:          string;
  title:       string;
  description: string | null;
  videoUrl:    string;
  unlockCount: number;
  isActive:    boolean;
  createdAt:   string;
}

interface Props {
  initial: PremiumVideo[];
}

export function VideoManager({ initial }: Props) {
  const [videos,    setVideos]    = useState<PremiumVideo[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [confirm,   setConfirm]   = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  // New video form state
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl,    setVideoUrl]     = useState<string | null>(null);
  const [fileName,    setFileName]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 25MB limit
    if (file.size > 25 * 1024 * 1024) {
      setError("Video must be under 25MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setFileName(file.name);

    const form = new FormData();
    form.append("file", file);
    form.append("type", "video");

    try {
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed."); return; }
      setVideoUrl(data.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!videoUrl)     { setError("Please upload a video first."); return; }

    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/videos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, description, videoUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }

      setVideos((prev) => [{ ...data, unlockCount: 0 }, ...prev]);
      setTitle("");
      setDescription("");
      setVideoUrl(null);
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setConfirm(null);
    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" });
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-1 font-semibold">Add Premium Video</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Clients pay <strong>KSH 100</strong> to unlock each video. Max 25MB, 3–4 minutes.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Exclusive Content"
              maxLength={120}
              className="w-full rounded-xl border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's in this video?"
              className="w-full resize-none rounded-xl border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Video File *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 py-8 hover:border-primary/50 hover:bg-muted/40 transition-colors"
            >
              {uploading ? (
                <><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading…</p></>
              ) : videoUrl ? (
                <><Video className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium text-primary">{fileName}</p>
                <p className="text-xs text-muted-foreground">Click to replace</p></>
              ) : (
                <><Video className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload video</p>
                <p className="text-xs text-muted-foreground">MP4 recommended · Max 25MB</p></>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={saving || uploading || !videoUrl || !title.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              : <><Plus className="h-4 w-4" /> Add Video — KSH 100 unlock price</>
            }
          </button>
        </div>
      </div>

      {/* Video list */}
      <div>
        <h2 className="mb-4 font-semibold">Your Premium Videos ({videos.length})</h2>
        {videos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card py-16 text-center text-muted-foreground">
            <Lock className="h-10 w-10 opacity-20" />
            <p className="font-semibold">No premium videos yet</p>
            <p className="text-sm">Upload your first video above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
                {/* Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Video className="h-5 w-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{video.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {video.unlockCount} unlock{video.unlockCount !== 1 ? "s" : ""} · KSH 100 each ·{" "}
                    {new Date(video.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Total earned: KSH {(video.unlockCount * 100).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                {deleting === video.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : confirm === video.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">Delete?</span>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700"
                    >Yes</button>
                    <button
                      onClick={() => setConfirm(null)}
                      className="rounded-lg border px-2.5 py-1 text-xs hover:bg-muted"
                    >No</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirm(video.id)}
                    className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
