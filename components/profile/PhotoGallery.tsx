"use client";
// components/profile/PhotoGallery.tsx
import { useState } from "react";
import { X, Play } from "lucide-react";

interface Photo {
  id:      string;
  url:     string;
  altText: string | null;
}

interface Props {
  photos:    Photo[];
  videoUrl?: string | null;
}

export function PhotoGallery({ photos, videoUrl }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [broken, setBroken] = useState<Set<string>>(new Set());

  const markBroken = (url: string) => setBroken((prev) => new Set([...prev, url]));
  const visiblePhotos = photos.filter((p) => !broken.has(p.url));

  return (
    <>
      {/* Video preview */}
      {videoUrl && (
        <div className="mb-4">
          {showVideo ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full rounded-xl max-h-72 object-contain bg-black"
            />
          ) : (
            <button
              onClick={() => setShowVideo(true)}
              className="relative w-full overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center group"
            >
              <video
                src={videoUrl}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                muted
                preload="metadata"
              />
              <div className="relative z-10 flex flex-col items-center gap-2 text-white">
                <div className="rounded-full bg-white/20 p-4 group-hover:bg-white/30 transition-colors">
                  <Play className="h-8 w-8 fill-white" />
                </div>
                <span className="text-sm font-medium">Play video</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Photo grid */}
      {visiblePhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {visiblePhotos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo.url)}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted hover:opacity-90 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.altText ?? "Gallery photo"}
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => markBroken(photo.url)}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
          <div className="flex max-h-[90vh] max-w-4xl w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="Full size"
              className="max-h-[90vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
