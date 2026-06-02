// components/home/HowItWorks.tsx
import { Search, Calendar, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find a Masseuse",
    description: "Search by location and service type. Browse verified profiles with ratings and reviews.",
  },
  {
    icon: Calendar,
    title: "Book a Session",
    description: "Choose your service, pick a date and time that works for you.",
  },
  {
    icon: CreditCard,
    title: "Pay Securely",
    description: "Pay via M-Pesa or card through Pesapal. Your booking is confirmed instantly.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/40 py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-3 text-2xl font-bold">How It Works</h2>
        <p className="mb-10 text-muted-foreground">Book a session in 3 simple steps</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="rounded-xl bg-card p-6 shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
