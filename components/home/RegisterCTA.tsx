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
              Grow Your Massage<br />Business on mconnect
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
                href="/register"
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
            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur ring-1 ring-white/20">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest opacity-70">Listing Plans</p>
              <div className="mt-4 space-y-3">
                {[
                  { tier: "Regular", price: "Free", color: "bg-white/20" },
                  { tier: "VIP",     price: "KES 1,500/mo", color: "bg-amber-400/30" },
                  { tier: "Premium", price: "KES 3,500/mo", color: "bg-purple-400/30" },
                  { tier: "VVIP",    price: "KES 6,000/mo", color: "bg-rose-400/30" },
                ].map(({ tier, price, color }) => (
                  <div
                    key={tier}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${color}`}
                  >
                    <span className="font-semibold">{tier}</span>
                    <span className="opacity-80">{price}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs opacity-60">
                Upgrade anytime. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
