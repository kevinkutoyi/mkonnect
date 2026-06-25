// components/profile/EarningsCard.tsx
// Earnings summary shown only to the masseuse (owner) on their own profile.
// Video unlocks: platform keeps 25%, masseuse earns 75%.
// Direct payments: platform keeps 10%, masseuse earns 90%.

import { TrendingUp, Video, Banknote, Info } from "lucide-react";

interface EarningsData {
  unlockGross:  number;
  directGross:  number;
}

const UNLOCK_COMMISSION  = 0.25; // 25% platform cut on video unlocks
const DIRECT_COMMISSION  = 0.10; // 10% platform cut on direct payments

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
        {label}
      </span>
      <span className={muted ? "text-xs font-medium text-muted-foreground" : "text-sm font-semibold"}>
        {value}
      </span>
    </div>
  );
}

export function EarningsCard({ data }: { data: EarningsData }) {
  const unlockNet  = data.unlockGross * (1 - UNLOCK_COMMISSION);
  const unlockCut  = data.unlockGross * UNLOCK_COMMISSION;
  const directNet  = data.directGross * (1 - DIRECT_COMMISSION);
  const directCut  = data.directGross * DIRECT_COMMISSION;
  const totalNet   = unlockNet + directNet;
  const totalGross = data.unlockGross + data.directGross;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-green-500" />
        <h2 className="text-xl font-bold">Your Earnings</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Visible only to you
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Video Unlocks */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Video className="h-4 w-4 text-purple-500" />
            <p className="font-semibold">Video Unlocks</p>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{fmt(unlockNet)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">your share (75%)</p>
          <div className="mt-4 space-y-1.5 border-t pt-3">
            <Row label="Total collected"    value={fmt(data.unlockGross)} />
            <Row label="Platform fee (25%)" value={`− ${fmt(unlockCut)}`} muted />
          </div>
        </div>

        {/* Direct Payments */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-blue-500" />
            <p className="font-semibold">Direct Payments</p>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{fmt(directNet)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">your share (90%)</p>
          <div className="mt-4 space-y-1.5 border-t pt-3">
            <Row label="Total collected"    value={fmt(data.directGross)} />
            <Row label="Platform fee (10%)" value={`− ${fmt(directCut)}`} muted />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-800 dark:bg-green-950/20">
        <div>
          <p className="text-sm text-muted-foreground">Total net earnings</p>
          <p className="text-xs text-muted-foreground">
            from {fmt(totalGross)} collected · platform kept {fmt(totalGross - totalNet)}
          </p>
        </div>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(totalNet)}</p>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Info className="h-3 w-3 shrink-0" />
        Earnings are paid out weekly via M-Pesa to your registered payout number.
      </p>
    </section>
  );
}
