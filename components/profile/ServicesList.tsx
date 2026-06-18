// components/profile/ServicesList.tsx
import { CheckCircle2 } from "lucide-react";

interface Props {
  services: string[];
}

export function ServicesList({ services }: Props) {
  if (!services || services.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Services Offered</h2>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0">
          {services.map((service, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-4 transition-colors hover:bg-muted/40 ${
                idx % 2 === 0 && idx + 1 < services.length ? "sm:border-r" : ""
              } ${idx >= 2 ? "border-t" : ""}`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm font-medium">{service}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
