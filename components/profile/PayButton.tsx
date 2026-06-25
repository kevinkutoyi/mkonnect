"use client";
// components/profile/PayButton.tsx
// Pay button on model profile — clients send a direct payment via Paystack

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, X, Loader2, Banknote } from "lucide-react";

interface Props {
  slug:        string;
  modelName:   string;
  isLoggedIn:  boolean;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export function PayButton({ slug, modelName, isLoggedIn }: Props) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [amount,  setAmount]  = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleOpen = () => {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    setOpen(true);
    setError(null);
  };

  const handlePay = async () => {
    const amt = Number(amount);
    if (!amt || amt < 50) { setError("Minimum payment is KSH 50."); return; }
    if (amt > 100_000)    { setError("Maximum payment is KSH 100,000."); return; }

    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/profiles/${slug}/pay`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: amt, message: message.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Payment failed. Please try again."); return; }
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
      >
        <Banknote className="h-4 w-4" />
        Pay {modelName.split(" ")[0]}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Pay {modelName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Secure payment via Paystack</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick amounts */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Quick select (KSH)</p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`rounded-xl border py-2 text-sm font-semibold transition-colors ${
                      amount === String(a)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground">
                Or enter amount (KSH)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  KSH
                </span>
                <input
                  type="number"
                  min={50}
                  max={100000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-xl border bg-muted/30 pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Optional message */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground">
                Message (optional)
              </label>
              <input
                type="text"
                maxLength={300}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave a note for the model…"
                className="mt-1.5 w-full rounded-xl border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              onClick={handlePay}
              disabled={loading || !amount}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                : <><CreditCard className="h-4 w-4" /> Pay KSH {Number(amount || 0).toLocaleString()}</>
              }
            </button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Payments are processed securely by Paystack. M-Pesa, card & more accepted.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
