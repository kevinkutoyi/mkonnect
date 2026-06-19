"use client";
// components/payments/PaymentStatusBanner.tsx
// Shown on /dashboard/listing after returning from Pesapal.
// - success   → green banner
// - failed    → red banner with retry CTA
// - pending   → yellow banner that auto-polls /api/payments/verify/:trackingId every 5s
// - cancelled → neutral banner

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type BannerStatus = "success" | "failed" | "pending" | "cancelled" | null;

interface Props {
  /** Value of the ?status= query param */
  status:          BannerStatus;
  /** ?trackingId= — needed for pending polling */
  trackingId?:     string;
  /** ?ref= — merchant reference shown in success state */
  merchantRef?:    string;
  /** ?reason= — optional detail for failed state */
  reason?:         string;
}

const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS        = 24; // 2 minutes — M-Pesa STK push can take time to register

export function PaymentStatusBanner({ status, trackingId, merchantRef, reason }: Props) {
  const router        = useRouter();
  const [current, setCurrent] = useState<BannerStatus>(status);
  const [pollCount, setPollCount]   = useState(0);
  const [tierLabel, setTierLabel]   = useState<string>("");
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto-poll when status is pending ─────────────────────────────────────────
  useEffect(() => {
    if (current !== "pending" || !trackingId) return;

    const poll = async () => {
      try {
        const res  = await fetch(`/api/payments/verify/${trackingId}`);
        const data = await res.json();

        if (data.tierDisplayName) setTierLabel(data.tierDisplayName);

        if (data.status === "ACTIVE") {
          clearInterval(timerRef.current!);
          setCurrent("success");
          router.refresh(); // Re-fetch server components to show new tier badge
          return;
        }
        if (data.status === "FAILED" || data.status === "CANCELLED") {
          clearInterval(timerRef.current!);
          setCurrent(data.status === "FAILED" ? "failed" : "cancelled");
          return;
        }
      } catch {
        // Network error — keep polling
      }

      setPollCount((c) => {
        if (c + 1 >= MAX_POLLS) {
          clearInterval(timerRef.current!);
        }
        return c + 1;
      });
    };

    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll(); // Immediate first check

    return () => clearInterval(timerRef.current!);
  }, [current, trackingId, router]);

  if (!current) return null;

  // ── Reason-to-message mapping ─────────────────────────────────────────────────
  const failedMessage =
    reason === "reversed"
      ? "Your payment was reversed or refunded. If this is unexpected, please contact support."
      : reason === "missing_params"
      ? "Payment response was incomplete. Please verify your payment status below."
      : "Your payment could not be processed. Please try again or choose a different payment method.";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="mb-6">
      {current === "success" && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/40">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">
              Payment successful{tierLabel ? ` — ${tierLabel} plan activated` : ""}!
            </p>
            <p className="mt-0.5 text-sm text-green-700 dark:text-green-400">
              Your listing is now live with the upgraded tier. Changes may take a few minutes to appear in search results.
              {merchantRef && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-500">
                  Ref: {merchantRef}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {current === "failed" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 dark:text-red-300">Payment failed</p>
            <p className="mt-0.5 text-sm text-red-700 dark:text-red-400">{failedMessage}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/listing")}
            className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Try again
          </button>
        </div>
      )}

      {current === "pending" && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/40">
          {pollCount >= MAX_POLLS ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
          ) : (
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-yellow-600 dark:text-yellow-400" />
          )}
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">
              {pollCount >= MAX_POLLS ? "Payment verification timed out" : "Payment processing…"}
            </p>
            <p className="mt-0.5 text-sm text-yellow-700 dark:text-yellow-400">
              {pollCount >= MAX_POLLS
                ? "We couldn't confirm your payment automatically. Check your M-Pesa messages — if you were charged your listing will activate within a few minutes via SMS notification. Refresh this page to check."
                : "Your payment is being confirmed. This usually takes under a minute. Please don't close this page."}
            </p>
          </div>
        </div>
      )}

      {current === "cancelled" && (
        <div className="flex items-start gap-3 rounded-xl border border-muted bg-muted/30 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">Payment cancelled</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              You cancelled the payment or it was reversed. Select a plan below to try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
