// components/home/RegisterCTA.tsx
import Link from "next/link";
import { ArrowRight, TrendingUp, Calendar, Wallet } from "lucide-react";

const perks = [
  { Icon: TrendingUp, text: "Get discovered by clients across Kenya" },
  { Icon: Calendar,   text: "Manage your bookings from one dashboard" },
  { Icon: Wallet,     text: "Get paid fast via M-Pesa" },
];

export function RegisterCTA() {
  return (
    <section className="bg-gradient-to-br from-primary via-rose-500 to-primary/80 py-24 text-primary-foreground">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-center md:justify-between">
          {/* Left copy */}
          <div className="max-w-xl text-center md:text-left">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-75">
              For Professionals
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight md:text-5xl">
              Grow Your Massage<br />Business on modelsraha
            </h2>
            <p className="mt-4 text-lg opacity-80 leading-relaxed">
              Join hundreds of models already building their client base on Kenya's
              fastest-growing wellness marketplace. Free to get started.
            </p>

            {/* Perks */}
            <ul className="mt-6 space-y-2">
              {perks.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl hover:-translate-y-0.5"
              >
                Join for free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold backdrop-blur transition-all hover:bg-white/20"
              >
                Browse listings
              </Link>
            </div>
          </div>

          {/* Right card */}
          <div className="w-full max-w-xs shrink-0">
            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur ring-1 ring-white/20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                🎉
              </div>
              <p className="text-xl font-extrabold">Free to join</p>
              <p className="mt-2 text-sm opacity-80 leading-relaxed">
                We're onboarding models for free right now. Create your profile,
                get discovered, and start earning — no listing fees.
              </p>
              <div className="mt-5 rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold">
                ✅ No credit card required
              </div>
              <p className="mt-4 text-xs opacity-60">
                Premium listing plans coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
