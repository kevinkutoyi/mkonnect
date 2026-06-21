"use client";
// components/onboarding/PhotoUploader.tsx
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Camera, Loader2 } from "lucide-react";

interface PhotoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onError?: (msg: string) => void;
}

const MAX_SIZE_MB   = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUploader({ value, onChange, onError }: PhotoUploaderProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type))
      return "Only JPEG, PNG, and WebP images are allowed.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024)
      return `Image must be smaller than ${MAX_SIZE_MB} MB.`;
    return null;
  };

  const upload = useCallback(async (file: File) => {
    const err = validate(file);
    if (err) { onError?.(err); return; }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { url } = await res.json();
      onChange(url);
    } catch (e: any) {
      onError?.(e.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [onChange, onError]);

  const handleFile  = (file: File) => upload(file);
  const handleDrop  = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value ? (
        <div className="relative mx-auto h-32 w-32">
          <Image
            src={value}
            alt="Profile photo"
            fill
            className="rounded-full object-cover ring-4 ring-primary/20"
            sizes="128px"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90 transition-colors"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e)  => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative mx-auto flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed transition-colors ${
            dragging
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/40 hover:border-primary/60 hover:bg-muted"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <Camera className="h-7 w-7 text-muted-foreground" />
              <span className="mt-1 text-xs text-muted-foreground">Upload photo</span>
            </>
          )}
        </div>
      )}

      {/* File input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {value ? "Change photo" : "Choose photo"}
        </button>
        <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · Max {MAX_SIZE_MB} MB</p>
      </div>
    </div>
  );
}
