"use client";
// components/services/ServiceCard.tsx
import {
  Clock, Home, Hotel, MapPin, Pencil, Trash2,
  GripVertical, Eye, EyeOff, BadgePercent,
} from "lucide-react";
import { formatKES, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: string | number;
  discountPrice?: string | number | null;
  homeService: boolean;
  hotelVisit: boolean;
  studioService: boolean;
  studioLocation?: any;
  isActive: boolean;
  requiresDeposit: boolean;
  depositAmount?: string | number | null;
  bookingCount: number;
  category?: { name: string; icon: string } | null;
}

interface ServiceCardProps {
  service:   Service;
  onEdit:    (s: Service) => void;
  onDelete:  (id: string, name: string) => void;
  onToggle:  (id: string, active: boolean) => void;
  dragging?: boolean;
}

export function ServiceCard({ service, onEdit, onDelete, onToggle, dragging }: ServiceCardProps) {
  const deliveryModes = [
    service.homeService  && { icon: <Home   className="h-3.5 w-3.5" />, label: "Home visit" },
    service.hotelVisit   && { icon: <Hotel  className="h-3.5 w-3.5" />, label: "Hotel/Airbnb" },
    service.studioService && { icon: <MapPin className="h-3.5 w-3.5" />, label: "Studio" },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card transition-all",
        dragging    && "shadow-2xl ring-2 ring-primary rotate-1 scale-105",
        !service.isActive && "opacity-60"
      )}
    >
      {/* Drag handle */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="px-5 py-4 pl-9">
        <div className="flex items-start justify-between gap-3">
          {/* Left: name + meta */}
          <div className="min-w-0 flex-1">
            {/* Category badge */}
            {service.category && (
              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {service.category.icon} {service.category.name}
              </span>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{service.name}</h3>
              {!service.isActive && (
                <span className="rounded-full border border-muted-foreground/30 px-2 py-0.5 text-xs text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>

            {service.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
            )}

            {/* Duration + delivery modes */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(service.duration)}
              </span>
              {deliveryModes.map((m) => (
                <span key={m.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                  {m.icon} {m.label}
                </span>
              ))}
            </div>

            {/* Studio location pill */}
            {service.studioService && service.studioLocation?.area && (
              <div className="mt-2 flex items-center gap-1 rounded-lg bg-muted px-2 py-1 w-fit text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {service.studioLocation.area}
                {service.studioLocation.buildingName && ` · ${service.studioLocation.buildingName}`}
              </div>
            )}

            {/* Deposit */}
            {service.requiresDeposit && service.depositAmount && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                Deposit required: {formatKES(service.depositAmount)}
              </p>
            )}

            {/* Booking count */}
            {service.bookingCount > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {service.bookingCount} booking{service.bookingCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Right: price + actions */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            {/* Price */}
            <div className="text-right">
              {service.discountPrice ? (
                <>
                  <p className="font-bold text-primary">{formatKES(service.discountPrice)}</p>
                  <p className="text-xs text-muted-foreground line-through">{formatKES(service.price)}</p>
                </>
              ) : (
                <p className="font-bold text-primary">{formatKES(service.price)}</p>
              )}
              {service.discountPrice && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <BadgePercent className="h-3 w-3" />
                  Sale
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggle(service.id, !service.isActive)}
                title={service.isActive ? "Deactivate" : "Activate"}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {service.isActive
                  ? <Eye    className="h-4 w-4" />
                  : <EyeOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => onEdit(service)}
                title="Edit"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(service.id, service.name)}
                title="Delete"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
