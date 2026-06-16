// components/profile/BookingSidebar.tsx
import Link from "next/link";
import { MessageCircle, CalendarCheck, Star, Clock, MapPin, Award } from "lucide-react";
import { formatKES } from "@/lib/utils";

const DAYS = [
  { key: "availableMon", short: "Mon" },
  { key: "availableTue", short: "Tue" },
  { key: "availableWed", short: "Wed" },
  { key: "availableThu", short: "Thu" },
  { key: "availableFri", short: "Fri" },
  { key: "availableSat", short: "Sat" },
  { key: "availableSun", short: "Sun" },
];

interface Props {
  profile: any;
  visible: boolean;
}

export function BookingSidebar({ profile, visible }: Props) {
  const phone      = profile.user.phone?.replace(/\D/g, "");
  const waMessage  = encodeURIComponent(
    `Hi ${profile.user.name}, I found your profile on mconnect and I'd like to book a session.`
  );
  const waUrl      = phone ? `https://wa.me/${phone}?text=${waMessage}` : null;

  const availableDays  = DAYS.filter((d) => profile[d.key]);
  const hoursLabel     = profile.availableFrom && profile.availableTo
    ? `${profile.availableFrom} – ${profile.availableTo}`
    : null;
  const startingPrice  = profile.minPrice;

  return (
    <div className="sticky top-24 space-y-4">
      {/* Main action card */}
      <div className="rounded-2xl border bg-card p-6 shadow-md shadow-black/5">
        {/* Price */}
        {startingPrice && (
          <div className="mb-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Starting from</p>
            <p className="text-3xl font-extrabold text-primary">
              {formatKES(startingPrice)}
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          {visible && (
            <Link
              href={`/booking/${profile.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-95"
            >
              <CalendarCheck className="h-5 w-5" />
              Book a Session
            </Link>
          )}

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] px-4 py-3 font-bold text-[#25D366] transition-all hover:bg-[#25D366]/10 active:scale-95"
            >
              <MessageCircle className="h-5 w-5" />
              Chat on WhatsApp
            </a>
          )}
        </div>

        {profile.mobileService && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Home &amp; hotel visits available
          </p>
        )}
      </div>

      {/* Stats card */}
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          At a Glance
        </h3>
        <div className="space-y-3">
          {profile.totalReviews > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-400" />
                Rating
              </span>
              <span className="font-semibold">
                {profile.avgRating.toFixed(1)}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  ({profile.totalReviews})
                </span>
              </span>
            </div>
          )}
          {profile.yearsExperience && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                Experience
              </span>
              <span className="font-semibold">{profile.yearsExperience} years</span>
            </div>
          )}
          {profile.city && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Location
              </span>
              <span className="font-semibold text-right text-sm">
                {profile.city.name}
                {profile.city.county ? `, ${profile.city.county.name}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Availability card */}
      {(availableDays.length > 0 || hoursLabel) && (
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Availability
          </h3>

          {hoursLabel && (
            <div className="mb-3 flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-semibold">{hoursLabel}</span>
            </div>
          )}

          {availableDays.length > 0 && (
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => {
                const active = profile[d.key];
                return (
                  <div
                    key={d.key}
                    className={`flex flex-col items-center rounded-lg py-1.5 text-center ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/40 text-muted-foreground/40"
                    }`}
                  >
                    <span className="text-[10px] font-bold">{d.short.slice(0, 2)}</span>
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                        active ? "bg-primary" : "bg-muted-foreground/20"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
