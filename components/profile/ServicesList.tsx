// components/profile/ServicesList.tsx
import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { formatKES, formatDuration } from "@/lib/utils";

interface Props {
  services: any[];
  profileId: string;
}

export function ServicesList({ services, profileId }: Props) {
  if (services.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Services &amp; Pricing</h2>
      <div className="divide-y rounded-2xl border bg-card overflow-hidden">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-start justify-between gap-4 p-5 transition-colors hover:bg-muted/40"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <p className="font-semibold">{service.name}</p>
              </div>
              {service.description && (
                <p className="mt-1 ml-6 text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              )}
              <div className="mt-2 ml-6 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(service.duration)}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-lg font-extrabold text-primary">
                {formatKES(Number(service.price))}
              </span>
              <Link
                href={`/booking/${profileId}`}
                className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 active:scale-95"
              >
                Book
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
