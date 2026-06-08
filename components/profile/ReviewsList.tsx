// components/profile/ReviewsList.tsx
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getInitials } from "@/lib/utils";

interface Props {
  reviews: any[];
  avgRating: number;
  total: number;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

function RatingBar({ count, total, label }: { count: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 shrink-0 text-right text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-yellow-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

export function ReviewsList({ reviews, avgRating, total }: Props) {
  // Compute distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Reviews</h2>

      {total === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          No reviews yet. Be the first to book!
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="mb-6 flex gap-6 rounded-2xl border bg-card p-6">
            {/* Big score */}
            <div className="flex shrink-0 flex-col items-center justify-center gap-1 pr-6 border-r">
              <span className="text-5xl font-extrabold">{avgRating.toFixed(1)}</span>
              <StarRating rating={Math.round(avgRating)} size="lg" />
              <span className="text-xs text-muted-foreground">{total} reviews</span>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-2">
              {dist.map(({ star, count }) => (
                <RatingBar key={star} label={String(star)} count={count} total={reviews.length} />
              ))}
            </div>
          </div>

          {/* Individual reviews */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {review.client.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.client.avatarUrl}
                        alt={review.client.name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(review.client.name)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{review.client.name}</p>
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {review.comment && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
