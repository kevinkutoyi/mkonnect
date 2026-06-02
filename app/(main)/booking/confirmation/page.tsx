// app/(main)/booking/confirmation/page.tsx
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { ref?: string; status?: string };
}) {
  const isSuccess = searchParams.status !== "failed";

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      {isSuccess ? (
        <>
          <CheckCircle className="mb-6 h-16 w-16 text-green-500" />
          <h1 className="mb-3 text-2xl font-bold">Booking Confirmed!</h1>
          <p className="mb-2 text-muted-foreground">
            Your session has been booked successfully. You'll receive a confirmation email shortly.
          </p>
          {searchParams.ref && (
            <p className="mb-6 text-sm text-muted-foreground">
              Reference: <span className="font-mono font-medium">{searchParams.ref}</span>
            </p>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-3xl">✕</span>
          </div>
          <h1 className="mb-3 text-2xl font-bold">Payment Failed</h1>
          <p className="mb-6 text-muted-foreground">
            Your payment could not be processed. Please try again.
          </p>
        </>
      )}
      <div className="flex gap-3">
        <Link
          href="/search"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Browse More
        </Link>
        <Link
          href="/dashboard/bookings"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          My Bookings
        </Link>
      </div>
    </div>
  );
}
