// components/home/SafetyNotice.tsx
import { ShieldCheck, BadgeCheck, Lock, Star } from "lucide-react";

const pillars = [
  {
    Icon: BadgeCheck,
    title: "Verified Profiles",
    description:
      "Every model is manually reviewed by our team. We check credentials, ID, and professional background before approval.",
  },
  {
    Icon: Lock,
    title: "Secure Payments",
    description:
      "All payments are processed by Pesapal, a licensed payment service provider. M-Pesa and card payments are fully encrypted.",
  },
  {
    Icon: Star,
    title: "Genuine Reviews",
    description:
      "Reviews are only submitted by clients who completed a booking. No fake ratings — what you see is real.",
  },
  {
    Icon: ShieldCheck,
    title: "Safe Bookings",
    description:
      "We have a clear Code of Conduct for all models. Any violation is reported and handled by our safety team.",
  },
];

export function SafetyNotice() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Banner */}
        <div className="mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-10 ring-1 ring-primary/15 md:p-14">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your Safety Matters
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Built on Trust &amp; Transparency
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              mconnect is a professional marketplace. We work only with verified, trained
              massage therapists. Our platform enforces a strict zero-tolerance policy
              against inappropriate conduct — keeping every booking safe for both clients and models.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ Icon, title, description }) => (
            <div key={title} className="rounded-2xl border bg-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
