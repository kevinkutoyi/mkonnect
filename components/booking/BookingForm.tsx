"use client";
// components/booking/BookingForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKES, formatDuration } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Props {
  profile: any;
  clientId: string;
}

export function BookingForm({ profile, clientId }: Props) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState(profile.services[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const service = profile.services.find((s: any) => s.id === selectedService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) { setError("Please select a date and time"); return; }
    setLoading(true);
    setError("");

    try {
      // 1. Create booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          serviceId: selectedService,
          scheduledAt: new Date(scheduledAt).toISOString(),
          notes: notes || undefined,
        }),
      });
      if (!bookingRes.ok) throw new Error("Failed to create booking");
      const booking = await bookingRes.json();

      // 2. Initiate payment
      const payRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      if (!payRes.ok) throw new Error("Failed to initiate payment");
      const { redirectUrl } = await payRes.json();

      // 3. Redirect to Pesapal
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setLoading(false);
    }
  };

  // Min datetime = now + 2h
  const minDateTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card p-6">
      {/* Service selection */}
      <div>
        <label className="mb-2 block text-sm font-medium">Select Service</label>
        <div className="space-y-2">
          {profile.services.map((s: any) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                selectedService === s.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="service"
                  value={s.id}
                  checked={selectedService === s.id}
                  onChange={() => setSelectedService(s.id)}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {formatDuration(s.duration)}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-primary">{formatKES(s.price)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <label htmlFor="scheduledAt" className="mb-2 block text-sm font-medium">
          Date & Time
        </label>
        <input
          id="scheduledAt"
          type="datetime-local"
          min={minDateTime}
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="mb-2 block text-sm font-medium">
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requests or preferences…"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {/* Summary */}
      {service && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <div className="flex justify-between">
            <span>{service.name}</span>
            <span className="font-semibold">{formatKES(service.price)}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {loading ? "Processing…" : `Pay ${service ? formatKES(service.price) : ""} via Pesapal`}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Secure payment powered by Pesapal · M-Pesa & cards accepted
      </p>
    </form>
  );
}
