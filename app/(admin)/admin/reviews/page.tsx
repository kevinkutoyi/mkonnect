// app/(admin)/admin/reviews/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { Star, CheckCircle2, EyeOff, Trash2, RefreshCw } from "lucide-react";

type ReviewStatus = "HIDDEN" | "VISIBLE" | "REMOVED";

interface Review {
  id:          string;
  ratingOverall: number;
  comment:     string | null;
  isAnonymous: boolean;
  status:      ReviewStatus;
  createdAt:   string;
  client:      { name: string; email: string } | null;
  profile:     { slug: string; user: { name: string } };
}

const STATUS_TABS: { key: ReviewStatus; label: string; color: string }[] = [
  { key: "HIDDEN",  label: "Pending",  color: "text-amber-600" },
  { key: "VISIBLE", label: "Approved", color: "text-emerald-600" },
  { key: "REMOVED", label: "Removed",  color: "text-rose-600" },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/20"}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [tab,     setTab]     = useState<ReviewStatus>("HIDDEN");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/reviews?status=${tab}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: "approve" | "hide" | "remove") => {
    setActing(id);
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Moderation</h1>
          <p className="text-sm text-muted-foreground">{total} review{total !== 1 ? "s" : ""} in this queue</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm hover:bg-muted">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border bg-muted/40 p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-card shadow-sm " + t.color
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          No reviews in this queue.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Left: review content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <StarRow rating={review.ratingOverall} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    {review.isAnonymous && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        Anonymous
                      </span>
                    )}
                  </div>

                  {review.comment ? (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      "{review.comment}"
                    </p>
                  ) : (
                    <p className="text-xs italic text-muted-foreground/60 mb-3">No comment</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">For:</span>{" "}
                      <a href={`/masseuse/${review.profile.slug}`} target="_blank"
                         className="underline hover:text-primary">
                        {review.profile.user.name}
                      </a>
                    </span>
                    {!review.isAnonymous && review.client && (
                      <span>
                        <span className="font-medium text-foreground">By:</span>{" "}
                        {review.client.name} ({review.client.email})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex shrink-0 flex-col gap-2">
                  {tab !== "VISIBLE" && (
                    <button
                      onClick={() => act(review.id, "approve")}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  )}
                  {tab !== "HIDDEN" && (
                    <button
                      onClick={() => act(review.id, "hide")}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Hide
                    </button>
                  )}
                  {tab !== "REMOVED" && (
                    <button
                      onClick={() => act(review.id, "remove")}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
