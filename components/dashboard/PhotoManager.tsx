"use client";
// components/dashboard/PhotoManager.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, Trash2, Star, StarOff, Video, X, Loader2, ImageIcon, Play, CheckCircle2,
} from "lucide-react";

interface Photo {
  id:        string;
  url:       string;
  isCover:   boolean;
  sortOrder: number;
}

interface StagedFile {
  file:    File;
  preview: string; // object URL
}

interface Props {
  initialPhotos:   Photo[];
  initialVideoUrl: string | null;
}

const MAX_PHOTOS = 12;

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
  const [savedPhotos,  setSavedPhotos]  = useState<Photo[]>(initialPhotos);
  const [staged,       setStaged]       = useState<StagedFile[]>([]);
  const [toDelete,     setToDelete]     = useState<Set<string>>(new Set());
  const [pendingCover, setPendingCover] = useState<string | null>(null); // id of cover to set on save

  const [videoUrl,       setVideoUrl]       = useState<string | null>(initialVideoUrl);
  const [videoUploading, setVideoUploading] = useState(false);

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => { staged.forEach((s) => URL.revokeObjectURL(s.preview)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (msg: string, type: "success" | "error") => {
    if (type === "success") { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
    else                    { setError(msg);   setTimeout(() => setError(null),   5000); }
  };

  // ── Stage photos locally ──────────────────────────────────────────────────
  const stageFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = MAX_PHOTOS - savedPhotos.length + toDelete.size - staged.length;
    if (remaining <= 0) { flash(`Maximum ${MAX_PHOTOS} photos reached.`, "error"); return; }

    const valid: StagedFile[] = [];
    for (const file of arr.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) { flash("Only image files are allowed.", "error"); continue; }
      if (file.size > 10 * 1024 * 1024)   { flash("Each photo must be under 10 MB.", "error"); continue; }
      valid.push({ file, preview: URL.createObjectURL(file) });
    }
    setStaged((prev) => [...prev, ...valid]);
  }, [savedPhotos.length, toDelete.size, staged.length]);

  const onPhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { stageFiles(e.target.files); e.target.value = ""; }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) stageFiles(e.dataTransfer.files);
  }, [stageFiles]);

  // ── Mark saved photo for deletion ─────────────────────────────────────────
  const toggleDelete = (id: string) => {
    setToDelete((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    // If cover is being deleted, clear pendingCover
    if (pendingCover === id) setPendingCover(null);
  };

  // ── Remove staged file before saving ─────────────────────────────────────
  const removeStaged = (preview: string) => {
    setStaged((prev) => {
      const item = prev.find((s) => s.preview === preview);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((s) => s.preview !== preview);
    });
  };

  // ── Set cover (deferred until Save) ──────────────────────────────────────
  const selectCover = (id: string) => {
    setPendingCover(id);
    setSavedPhotos((prev) => prev.map((p) => ({ ...p, isCover: p.id === id })));
  };

  // ── Save all changes ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // 1. Delete marked photos
      for (const id of toDelete) {
        const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete a photo.");
      }
      setSavedPhotos((prev) => prev.filter((p) => !toDelete.has(p.id)));
      setToDelete(new Set());

      // 2. Upload staged files
      const newPhotos: Photo[] = [];
      for (const { file, preview } of staged) {
        const { url } = await uploadToServer(file);
        const saveRes = await fetch("/api/photos", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ url, sizeBytes: file.size }),
        });
        if (!saveRes.ok) {
          const err = await saveRes.json().catch(() => ({}));
          throw new Error(err?.error ?? "Failed to save photo.");
        }
        newPhotos.push(await saveRes.json());
        URL.revokeObjectURL(preview);
      }
      setSavedPhotos((prev) => [...prev, ...newPhotos]);
      setStaged([]);

      // 3. Update cover if changed
      if (pendingCover) {
        await fetch(`/api/photos/${pendingCover}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ isCover: true }),
        });
        setPendingCover(null);
      }

      flash("Changes saved!", "success");
    } catch (e: any) {
      flash(e.message ?? "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = toDelete.size > 0 || staged.length > 0 || pendingCover !== null;
  const totalVisible = savedPhotos.length - toDelete.size + staged.length;

  // ── Video upload (immediate) ──────────────────────────────────────────────
  const handleVideoFile = async (file: File) => {
    if (!file.type.startsWith("video/")) { flash("Only video files are allowed.", "error"); return; }
    if (file.size > 25 * 1024 * 1024)   { flash("Video must be under 25 MB.", "error"); return; }
    setVideoUploading(true);
    setError(null);
    try {
      const { url } = await uploadToServer(file);
      const res = await fetch("/api/profile/video", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url }),
      });
      if (!res.ok) throw new Error("Failed to save video.");
      setVideoUrl(url);
      flash("Video saved!", "success");
    } catch (e: any) {
      flash(e.message ?? "Video upload failed.", "error");
    } finally {
      setVideoUploading(false);
    }
  };

  const removeVideo = async () => {
    const res = await fetch("/api/profile/video", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: null }),
    });
    if (!res.ok) { flash("Failed to remove video.", "error"); return; }
    setVideoUrl(null);
    flash("Video removed.", "success");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">
      {/* Feedback */}
      {error   && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400">{error}</div>}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      {/* ── Photos ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Photos</h2>
            <p className="text-sm text-muted-foreground">
              {totalVisible}/{MAX_PHOTOS} photos · ★ = profile cover
            </p>
          </div>
          {totalVisible < MAX_PHOTOS && (
            <button
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Upload className="h-4 w-4" /> Add photos
            </button>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotoInputChange} />
        </div>

        {/* Empty state */}
        {totalVisible === 0 && (
          <div
            onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
            onClick={() => photoInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop photos here or click to add</p>
              <p className="text-sm text-muted-foreground">JPG, PNG, WEBP · max 10 MB each · up to {MAX_PHOTOS} photos</p>
            </div>
          </div>
        )}

        {/* Grid */}
        {totalVisible > 0 && (
          <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} className="grid grid-cols-3 gap-3 sm:grid-cols-4">

            {/* Saved photos */}
            {savedPhotos.map((photo) => {
              const deleted = toDelete.has(photo.id);
              return (
                <div key={photo.id} className={`relative aspect-square overflow-hidden rounded-xl bg-muted ${deleted ? "opacity-40" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="Gallery photo" className="absolute inset-0 h-full w-full object-cover" />

                  {/* Cover badge */}
                  {photo.isCover && !deleted && (
                    <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900">
                      <Star className="h-3 w-3" /> Cover
                    </div>
                  )}

                  {/* Actions — always visible */}
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                    {!photo.isCover && !deleted && (
                      <button
                        onClick={() => selectCover(photo.id)}
                        title="Set as cover"
                        className="rounded-full bg-black/60 p-1.5 text-white hover:bg-yellow-400 hover:text-yellow-900 transition-colors"
                      >
                        <StarOff className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleDelete(photo.id)}
                      title={deleted ? "Undo delete" : "Delete photo"}
                      className={`rounded-full p-1.5 text-white transition-colors ${deleted ? "bg-muted-foreground hover:bg-muted-foreground/80" : "bg-black/60 hover:bg-red-500"}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {deleted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">Will be deleted</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Staged (pending upload) */}
            {staged.map((s) => (
              <div key={s.preview} className="relative aspect-square overflow-hidden rounded-xl bg-muted ring-2 ring-primary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.preview} alt="Pending upload" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  New
                </div>
                <button
                  onClick={() => removeStaged(s.preview)}
                  title="Remove"
                  className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 p-1.5 text-white hover:bg-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Add more tile */}
            {totalVisible < MAX_PHOTOS && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Upload className="h-6 w-6" />
              </button>
            )}
          </div>
        )}

        {/* Save button */}
        {hasChanges && (
          <div className="mt-4 flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {staged.length > 0 && `${staged.length} photo${staged.length !== 1 ? "s" : ""} to upload`}
              {staged.length > 0 && toDelete.size > 0 && " · "}
              {toDelete.size > 0 && `${toDelete.size} to delete`}
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
            </button>
          </div>
        )}
      </section>

      {/* ── Video ─────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Profile Video</h2>
            <p className="text-sm text-muted-foreground">One short video shown on your profile. Max 25 MB.</p>
          </div>
          {!videoUrl && (
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={videoUploading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {videoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              Upload video
            </button>
          )}
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { handleVideoFile(e.target.files[0]); e.target.value = ""; } }} />
        </div>

        {videoUrl ? (
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video src={videoUrl} controls className="w-full max-h-80 object-contain" />
            <button
              onClick={removeVideo}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        ) : (
          <div
            onClick={() => videoInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            {videoUploading ? (
              <><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="font-medium">Uploading video…</p></>
            ) : (
              <><Play className="h-10 w-10 text-muted-foreground" /><div><p className="font-medium">Click to upload a video</p><p className="text-sm text-muted-foreground">MP4, MOV, WEBM · max 25 MB</p></div></>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
