// components/home/HowItWorks.tsx
import { Search, Calendar, CreditCard } from "lucide-react";

const steps = [
  {
    Icon: Search,
    title: "Find a Masseuse",
    description: "Search by location and service type. Browse verified profiles with ratings and reviews.",
  },
  {
    Icon: Calendar,
    title: "Book a Session",
    description: "Choose your service, pick a date and time that works for you.",
  },
  {
    Icon: CreditCard,
    title: "Pay Securely",
    description: "Pay via M-Pesa or card through Pesapal. Your booking is confirmed instantly.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 bg-muted/40">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-2xl font-bold mb-2">How It Works</h2>
        <p className="text-muted-foreground mb-10">Book a session in 3 simple steps</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ Icon, title, description }) => (
            <div key={title} className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
