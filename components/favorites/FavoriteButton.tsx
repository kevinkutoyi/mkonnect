// components/favorites/FavoriteButton.tsx
"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  profileId:    string;
  initialSaved: boolean;
  isLoggedIn:   boolean;
  size?: "sm" | "md";
}

export function FavoriteButton({ profileId, initialSaved, isLoggedIn, size = "md" }: Props) {
  const [saved,   setSaved]   = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);
    const next = !saved;
    setSaved(next); // optimistic

    try {
      const res = await fetch(`/api/favorites/${profileId}`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) setSaved(!next); // revert on error
    } catch {
      setSaved(!next);
    } finally {
      setLoading(false);
    }
  };

  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btn  = size === "sm"
    ? "h-8 w-8 rounded-xl"
    : "h-10 w-10 rounded-xl";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from favorites" : "Save to favorites"}
      className={`${btn} flex items-center justify-center border bg-background/80 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 disabled:opacity-60 ${
        saved
          ? "border-rose-300 bg-rose-50 text-rose-500 dark:border-rose-700 dark:bg-rose-950/30"
          : "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-500"
      }`}
    >
      <Heart className={`${icon} transition-all ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
    </button>
  );
}
