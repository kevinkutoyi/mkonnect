"use client";

// components/dashboard/PayoutPhoneForm.tsx
// Masseuse sets/updates their M-Pesa payout number.

import { useState } from "react";
import { Smartphone, Check, AlertCircle, Loader2 } from "lucide-react";

export function PayoutPhoneForm({ current }: { current: string | null }) {
  const [phone,   setPhone]   = useState(current ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res  = await fetch("/api/masseuse/payout-phone", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ payoutPhone: phone }),
    });
    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to save");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">M-Pesa Payout Number</h2>
        {current && (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            ✓ Set
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Your weekly earnings will be sent to this M-Pesa number every Monday.
        Enter your number in any format (e.g. 0712345678 or 254712345678).
      </p>

      <div className="flex gap-3">
        <input
          type="tel"
          placeholder="e.g. 0712 345 678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSave}
          disabled={loading || !phone.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : success ? (
            <><Check className="h-4 w-4" /> Saved</>
          ) : (
            "Save"
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {!current && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5" />
          No payout number set — you won't receive weekly payouts until you add one.
        </p>
      )}
    </div>
  );
}
