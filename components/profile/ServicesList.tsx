// components/profile/ServicesList.tsx
import { CheckCircle2 } from "lucide-react";

interface Props {
  services: any[];
  profileId: string;
}

export function ServicesList({ services }: Props) {
  if (services.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Services Offered</h2>
      <div className="rounded-2xl border bg-card overflow-hidden divide-y">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/40"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold">{service.name}</p>
              {service.description && (
                <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
