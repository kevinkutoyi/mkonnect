// components/profile/ServicesList.tsx
import Link from "next/link";
import { Clock } from "lucide-react";
import { formatKES, formatDuration } from "@/lib/utils";

interface Props {
  services: any[];
  profileId: string;
}

export function ServicesList({ services, profileId }: Props) {
  if (services.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Services</h2>
      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between rounded-xl border bg-card p-4"
          >
            <div className="flex-1">
              <p className="font-medium">{service.name}</p>
              {service.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{service.description}</p>
              )}
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(service.duration)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-primary">{formatKES(service.price)}</span>
              <Link
                href={`/booking/${profileId}`}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Book
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
