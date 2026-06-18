// app/(dashboard)/dashboard/listing/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TierSelector } from "@/components/tiers/TierSelector";
import { TierBadge } from "@/components/tiers/TierBadge";
import { PaymentStatusBanner } from "@/components/payments/PaymentStatusBanner";
import {
  ListingStatusCard,
  type ListingStatus,
} from "@/components/dashboard/ListingStatusCard";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Listing Plan — modelsraha" };

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  EXPIRED:   "bg-muted text-muted-foreground",
  PENDING:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  FAILED:    "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default async function ListingPage({
  searchParams,
}: {
  searchParams: {
    status?:     string;  // success | failed | pending | cancelled
    trackingId?: string;  // Pesapal orderTrackingId (used for pending polling)
    ref?:        string;  // merchant reference (shown in success banner)
    reason?:     string;  // failed reason detail
  };
}) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") redirect("/");

  const [tiers, profile] = await Promise.all([
    prisma.listingTier.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.masseuseProfile.findUnique({
      where:  { userId: session.user.id },
      select: {
        id:             true,
        activeTierId:   true,
        activeTierName: true,
        subscriptions: {
          where:   { status: "ACTIVE", expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take:    1,
          include: { tier: { select: { name: true, displayName: true, badge: true, durationDays: true } } },
        },
      },
    }),
  ]);

  const history = await prisma.profileSubscription.findMany({
    where:   { profileId: profile?.id ?? "" },
    orderBy: { createdAt: "desc" },
    take:    10,
    include: { tier: { select: { displayName: true, badge: true } } },
  });

  const activeSub = profile?.subscriptions[0] ?? null;
  const now       = new Date();

  const activeSubForSelector = activeSub
    ? {
        tierId:    activeSub.tierId,
        tierName:  activeSub.tier.name as any,
        expiresAt: activeSub.expiresAt!.toISOString(),
        status:    activeSub.status,
      }
    : null;

  // ── Listing status for the status card ──────────────────────────────────────
  let listingStatus: ListingStatus;
  if (activeSub && activeSub.expiresAt && activeSub.expiresAt > now) {
    const daysLeft = Math.ceil(
      (activeSub.expiresAt.getTime() - now.getTime()) / 86_400_000
    );
    listingStatus = {
      state:        daysLeft <= 3 ? "EXPIRING" : "ACTIVE",
      tierName:     activeSub.tier.displayName,
      tierBadge:    activeSub.tier.badge ?? undefined,
      expiresAt:    activeSub.expiresAt.toISOString(),
      daysLeft,
      durationDays: activeSub.tier.durationDays,
    };
  } else if (activeSub) {
    listingStatus = { state: "EXPIRED" };
  } else {
    listingStatus = { state: "NONE" };
  }

  // Normalise status — only pass values PaymentStatusBanner knows about
  const bannerStatus =
    searchParams.status === "success"   ? "success"
    : searchParams.status === "failed"  ? "failed"
    : searchParams.status === "pending" ? "pending"
    : searchParams.status === "cancelled" ? "cancelled"
    : null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Listing Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a plan to activate your profile and appear in search results.
          </p>
        </div>
        {profile?.activeTierName && (
          <TierBadge tier={profile.activeTierName} size="lg" />
        )}
      </div>

      {/* Listing expiry status */}
      <ListingStatusCard status={listingStatus} />

      {/* Payment status banner (client component — handles pending polling) */}
      <PaymentStatusBanner
        status={bannerStatus as any}
        trackingId={searchParams.trackingId}
        merchantRef={searchParams.ref}
        reason={searchParams.reason}
      />

      {/* No profile warning */}
      {!profile && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          ⚠ Complete your{" "}
          <a href="/dashboard/profile" className="font-medium underline">
            profile setup
          </a>{" "}
          before purchasing a listing plan.
        </div>
      )}

      {/* Tier selector */}
      <TierSelector tiers={tiers as any} activeSub={activeSubForSelector} />

      {/* Payment history */}
      {history.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold">Payment History</h2>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((sub) => (
                  <tr key={sub.id} className="bg-card transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {sub.tier.badge} {sub.tier.displayName}
                    </td>
                    <td className="px-4 py-3">
                      {sub.amountPaid
                        ? `KES ${Number(sub.amountPaid).toLocaleString()}`
                        : sub.grantedByAdmin
                        ? "Free (Admin)"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[sub.status] ?? ""
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.expiresAt
                        ? new Date(sub.expiresAt).toLocaleDateString("en-KE")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString("en-KE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
