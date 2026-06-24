"use client";
// components/videos/PremiumVideoCard.tsx

import { useState } from "react";
import { Lock, Play, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

interface Props {
  video: {
    id:          string;
    title:       string;
    description: string | null;
    price:       number;
    unlockCount: number;
    isUnlocked:  boolean;
    videoUrl:    string | null;
    profile: {
      slug:     string;
      name:     string;
      avatarUrl: string | null;
      city:     string | null;
    };
  };
  isLoggedIn: boolean;
}

export function PremiumVideoCard({ video, isLoggedIn }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);

  const handleUnlock = async () => {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/videos/${video.id}/unlock`, { method: "POST" });
      const data = await res.json();
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else alert(data.error ?? "Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Video / Thumbnail area */}
      <div className="relative aspect-video bg-muted">
        {video.isUnlocked && video.videoUrl ? (
          playing ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={video.videoUrl}
              controls
              autoPlay
              className="h-full w-full object-contain bg-black"
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <Play className="h-7 w-7 fill-primary text-primary ml-1" />
              </div>
            </button>
          )
        ) : (
          /* Locked state */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-black/60 to-black/80">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-white">KSH 100 to unlock</p>
            <button
              onClick={handleUnlock}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                : "Unlock Now — KSH 100"
              }
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold line-clamp-1">{video.title}</p>
        {video.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{video.description}</p>
        )}

        {/* Model info */}
        <Link
          href={`/model/${video.profile.slug}`}
          className="mt-3 flex items-center gap-2 group"
        >
          {video.profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.profile.avatarUrl}
              alt={video.profile.name}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {getInitials(video.profile.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
              {video.profile.name}
            </p>
            {video.profile.city && (
              <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />{video.profile.city}
              </p>
            )}
          </div>
        </Link>

        {/* Stats */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{video.unlockCount} {video.unlockCount === 1 ? "unlock" : "unlocks"}</span>
          {video.isUnlocked && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 font-semibold dark:bg-green-900/30 dark:text-green-400">
              Unlocked ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
