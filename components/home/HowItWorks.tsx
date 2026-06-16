// components/home/HowItWorks.tsx
import { Search, CalendarCheck, ShieldCheck } from "lucide-react";

const steps = [
  {
    step: "01",
    Icon: Search,
    title: "Find Your Model",
    description:
      "Search by city, service type, or price. Filter by rating and availability. Every profile is verified before going live.",
  },
  {
    step: "02",
    Icon: CalendarCheck,
    title: "Book a Session",
    description:
      "Choose your preferred service, date, and time. Instant confirmation — no waiting, no phone calls.",
  },
  {
    step: "03",
    Icon: ShieldCheck,
    title: "Pay & Relax",
    description:
      "Pay securely via M-Pesa or card through Pesapal. Your payment is held safely and released after the session.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Simple Process
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight">How It Works</h2>
          <p className="mt-1 text-muted-foreground">Book a professional session in 3 easy steps</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map(({ step, Icon, title, description }, i) => (
            <div key={step} className="relative flex flex-col items-center text-center md:items-start md:text-left">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+40px)] top-7 hidden h-px w-[calc(100%-80px)] bg-border md:block" />
              )}

              {/* Icon circle with step number */}
              <div className="relative mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                  {i + 1}
                </span>
              </div>

              <h3 className="mb-2 text-lg font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
