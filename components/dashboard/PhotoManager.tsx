"use client";
// components/dashboard/PhotoManager.tsx
// Manage gallery photos and profile video from the dashboard.
// Upload flow: get signed URL from /api/upload → POST to Cloudinary → save URL via /api/photos

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import {
  Upload, Trash2, Star, StarOff, Video, X, Loader2, ImageIcon, Play,
} from "lucide-react";

interface Photo {
  id:       string;
  url:      string;
  isCover:  boolean;
  sortOrder: number;
}

interface Props {
  initialPhotos: Photo[];
  initialVideoUrl: string | null;
}

const MAX_PHOTOS = 12;

// ── Server upload helper ──────────────────────────────────────────────────────
async function uploadToServer(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Upload failed");
  }
  return res.json();
}

export function PhotoManager({ initialPhotos, initialVideoUrl }: Props) {
  const [photos,   setPhotos]   = useState<Photo[]>(initialPhotos);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string, type: "success" | "error") => {
    if (type === "success") { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
    else                    { setError(msg);   setTimeout(() => setError(null),   4000); }
  };

  // ── Upload photos ──────────────────────────────────────────────────────────
  const handlePhotoFiles = useCallback(async (files: FileList) => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { flash(`Maximum ${MAX_PHOTOS} photos reached.`, "error"); return; }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError(null);

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) { flash("Only image files are allowed.", "error"); continue; }
      if (file.size > 10 * 1024 * 1024)   { flash("Each photo must be under 10 MB.", "error"); continue; }

      try {
        const { url } = await uploadToServer(file);

        const saveRes = await fetch("/api/photos", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ url, sizeBytes: file.size }),
        });
        if (!saveRes.ok) {
          const err = await saveRes.json();
          flash(err.error ?? "Failed to save photo.", "error");
          continue;
        }
        const saved: Photo = await saveRes.json();
        setPhotos((prev) => [...prev, saved]);
      } catch (e: any) {
        flash(e.message ?? "Upload failed.", "error");
      }
    }

    setUploading(false);
    flash("Photos uploaded!", "success");
  }, [photos.length]);

  const onPhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handlePhotoFiles(e.target.files);
      e.target.value = "";
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handlePhotoFiles(e.dataTransfer.files);
  }, [handlePhotoFiles]);

  // ── Delete photo ───────────────────────────────────────────────────────────
  const deletePhoto = async (id: string) => {
    const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
    if (!res.ok) { flash("Failed to delete photo.", "error"); return; }
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      // If deleted was cover, first remaining becomes cover locally
      if (prev.find((p) => p.id === id)?.isCover && updated.length > 0) {
        updated[0].isCover = true;
      }
      return updated;
    });
  };

  // ── Set cover ──────────────────────────────────────────────────────────────
  const setCover = async (id: string) => {
    const res = await fetch(`/api/photos/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isCover: true }),
    });
    if (!res.ok) { flash("Failed to set cover.", "error"); return; }
    setPhotos((prev) =>
      prev.map((p) => ({ ...p, isCover: p.id === id }))
    );
    flash("Cover photo updated!", "success");
  };

  // ── Upload video ───────────────────────────────────────────────────────────
  const handleVideoFile = async (file: File) => {
    if (!file.type.startsWith("video/")) { flash("Only video files are allowed.", "error"); return; }
    if (file.size > 25 * 1024 * 1024)   { flash("Video must be under 25 MB.", "error"); return; }

    setVideoUploading(true);
    setError(null);
    try {
      const { url } = await uploadToServer(file);

      const saveRes = await fetch("/api/profile/video", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ videoUrl: url }),
      });
      if (!saveRes.ok) { flash("Failed to save video.", "error"); return; }
      setVideoUrl(url);
      flash("Video uploaded!", "success");
    } catch (e: any) {
      flash(e.message ?? "Video upload failed.", "error");
    } finally {
      setVideoUploading(false);
    }
  };

  const onVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { handleVideoFile(e.target.files[0]); e.target.value = ""; }
  };

  // ── Remove video ───────────────────────────────────────────────────────────
  const removeVideo = async () => {
    const res = await fetch("/api/profile/video", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ videoUrl: null }),
    });
    if (!res.ok) { flash("Failed to remove video.", "error"); return; }
    setVideoUrl(null);
    flash("Video removed.", "success");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">
      {/* Feedback banners */}
      {error   && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-400">{success}</div>}

      {/* ── Photos section ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Photos</h2>
            <p className="text-sm text-muted-foreground">
              {photos.length}/{MAX_PHOTOS} photos. The ★ photo is your profile cover.
            </p>
          </div>
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Add Photos
            </button>
          )}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onPhotoInputChange}
          />
        </div>

        {/* Drop zone (shown when no photos yet) */}
        {photos.length === 0 && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => photoInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop photos here or click to upload</p>
              <p className="text-sm text-muted-foreground">JPG, PNG, WEBP up to 10 MB each · max {MAX_PHOTOS} photos</p>
            </div>
          </div>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="grid grid-cols-3 gap-3 sm:grid-cols-4"
          >
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
                <Image
                  src={photo.url}
                  alt="Gallery photo"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 25vw"
                />
                {/* Cover badge */}
                {photo.isCover && (
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900">
                    <Star className="h-3 w-3" /> Cover
                  </div>
                )}
                {/* Action overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {!photo.isCover && (
                    <button
                      onClick={() => setCover(photo.id)}
                      title="Set as cover"
                      className="rounded-full bg-white/20 p-2 text-white hover:bg-yellow-400 hover:text-yellow-900 transition-colors"
                    >
                      <StarOff className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    title="Delete photo"
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {/* Add more tile */}
            {photos.length < MAX_PHOTOS && (
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Video section ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Profile Video</h2>
            <p className="text-sm text-muted-foreground">
              One short video shown on your profile. Max 25 MB.
            </p>
          </div>
          {!videoUrl && (
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={videoUploading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {videoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              Upload Video
            </button>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={onVideoInputChange}
          />
        </div>

        {videoUrl ? (
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              src={videoUrl}
              controls
              className="w-full max-h-80 object-contain"
            />
            <button
              onClick={removeVideo}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Remove video
            </button>
          </div>
        ) : (
          <div
            onClick={() => videoInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            {videoUploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium">Uploading video…</p>
              </>
            ) : (
              <>
                <Play className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Click to upload a video</p>
                  <p className="text-sm text-muted-foreground">MP4, MOV, WEBM up to 25 MB</p>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
