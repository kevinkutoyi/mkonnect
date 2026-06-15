// components/trust/TrustBadges.tsx
import { BadgeCheck, CreditCard, ShieldCheck } from "lucide-react";

export type VerificationLevel =
  | "UNVERIFIED"
  | "EMAIL_VERIFIED"
  | "PHONE_VERIFIED"
  | "ID_VERIFIED"
  | "FULLY_VERIFIED";

interface Props {
  verificationLevel: VerificationLevel;
  listingActive:     boolean;
  hasActivePayment?: boolean; // pass true if subscription is ACTIVE
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

const VERIFIED_LEVELS: VerificationLevel[] = ["ID_VERIFIED", "FULLY_VERIFIED"];

interface BadgeDef {
  show:    boolean;
  label:   string;
  tooltip: string;
  icon:    React.ElementType;
  cls:     string; // icon + bg colour
}

export function TrustBadges({
  verificationLevel,
  listingActive,
  hasActivePayment = listingActive,
  size = "md",
  showLabels = false,
}: Props) {
  const isVerified = VERIFIED_LEVELS.includes(verificationLevel);

  const badges: BadgeDef[] = [
    {
      show:    isVerified,
      label:   verificationLevel === "FULLY_VERIFIED" ? "Fully Verified" : "ID Verified",
      tooltip: "Identity verified by mconnect admin",
      icon:    BadgeCheck,
      cls:     "bg-primary/10 text-primary border-primary/20",
    },
    {
      show:    hasActivePayment,
      label:   "Verified Payment",
      tooltip: "Active subscription confirmed",
      icon:    CreditCard,
      cls:     "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-700 dark:text-emerald-400",
    },
    {
      show:    listingActive,
      label:   "Active Listing",
      tooltip: "Profile is publicly listed",
      icon:    ShieldCheck,
      cls:     "bg-sky-500/10 text-sky-600 border-sky-300 dark:border-sky-700 dark:text-sky-400",
    },
  ].filter((b) => b.show);

  if (badges.length === 0) return null;

  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";
  const padding  = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-1";

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map(({ label, tooltip, icon: Icon, cls }) => (
        <span
          key={label}
          title={tooltip}
          className={`flex items-center gap-1 rounded-full border font-semibold ${cls} ${padding} ${textSize}`}
        >
          <Icon className={`${iconSize} shrink-0`} />
          {showLabels && <span>{label}</span>}
        </span>
      ))}
    </div>
  );
}

// Standalone icon-only badge for overlaying on cards
export function TrustBadgeIcons({
  verificationLevel,
  listingActive,
}: Pick<Props, "verificationLevel" | "listingActive">) {
  const isVerified = VERIFIED_LEVELS.includes(verificationLevel);

  return (
    <div className="flex gap-1">
      {isVerified && (
        <span title="Identity verified">
          <BadgeCheck className="h-4 w-4 text-primary drop-shadow" />
        </span>
      )}
      {listingActive && (
        <span title="Active listing">
          <ShieldCheck className="h-4 w-4 text-emerald-500 drop-shadow" />
        </span>
      )}
      {listingActive && (
        <span title="Payment verified">
          <CreditCard className="h-4 w-4 text-sky-400 drop-shadow" />
        </span>
      )}
    </div>
  );
}
