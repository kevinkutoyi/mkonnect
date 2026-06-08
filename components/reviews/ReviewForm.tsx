// components/reviews/ReviewForm.tsx
"use client";
import { useState } from "react";
import { Star, UserX, Send, CheckCircle } from "lucide-react";

interface Props {
  profileId:   string;
  profileName: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-9 w-9 transition-colors ${
                i <= (hover || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="h-4 text-xs font-medium text-muted-foreground">
        {labels[hover || value]}
      </span>
    </div>
  );
}

type State = "idle" | "submitting" | "success" | "error";

export function ReviewForm({ profileId, profileName }: Props) {
  const [rating,      setRating]      = useState(0);
  const [comment,     setComment]     = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [state,       setState]       = useState<State>("idle");
  const [errorMsg,    setErrorMsg]    = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ profileId, rating, comment: comment.trim() || undefined, isAnonymous }),
      });

      if (res.ok) {
        setState("success");
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <h3 className="text-lg font-bold">Review submitted!</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your review is pending admin approval and will appear once approved. Thank you!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="mb-1 text-lg font-bold">Leave a Review</h3>
      <p className="mb-5 text-sm text-muted-foreground">
        Share your experience with {profileName}
      </p>

      <form onSubmit={submit} className="space-y-5">
        {/* Star rating */}
        <div>
          <label className="mb-2 block text-sm font-medium">Your Rating *</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Comment */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="review-comment">
            Comment <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Tell others about your experience…"
            className="w-full resize-none rounded-xl border bg-muted/40 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/2000</p>
        </div>

        {/* Anonymous toggle */}
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <div className={`h-5 w-9 rounded-full transition-colors ${isAnonymous ? "bg-primary" : "bg-muted-foreground/30"}`} />
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isAnonymous ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <UserX className="h-4 w-4 text-muted-foreground" />
            <span>Post anonymously</span>
          </div>
        </label>

        {errorMsg && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={rating === 0 || state === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 active:scale-95"
        >
          <Send className="h-4 w-4" />
          {state === "submitting" ? "Submitting…" : "Submit Review"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Reviews are moderated before publishing.
        </p>
      </form>
    </div>
  );
}
