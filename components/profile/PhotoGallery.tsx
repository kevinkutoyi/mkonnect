"use client";
// components/profile/PhotoGallery.tsx
import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  photos: any[];
}

export function PhotoGallery({ photos }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Gallery</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo.url)}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted hover:opacity-90 transition-opacity"
            >
              <Image
                src={photo.url}
                alt={photo.altText ?? "Gallery photo"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, 25vw"
              />
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
          <div className="relative max-h-[90vh] max-w-4xl w-full aspect-video">
            <Image
              src={lightbox}
              alt="Full size"
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
