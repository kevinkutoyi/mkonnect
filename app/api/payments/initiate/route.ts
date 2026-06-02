// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerIPN, submitOrder } from "@/lib/pesapal";
import { generateMerchantRef } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = await req.json();
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, clientId: session.user.id },
    include: {
      service: true,
      client: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.payment?.status === "COMPLETED") {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }

  const merchantReference = generateMerchantRef();

  // Register IPN
  const ipnId = await registerIPN();

  const nameParts = booking.client.name.split(" ");
  const result = await submitOrder({
    merchantReference,
    amount: Number(booking.totalAmount),
    currency: "KES",
    description: `${booking.service.name} - mconnect`,
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/payments/callback`,
    ipnId,
    billingEmail: booking.client.email,
    billingPhone: booking.client.phone ?? undefined,
    billingFirstName: nameParts[0],
    billingLastName: nameParts.slice(1).join(" ") || nameParts[0],
  });

  // Create or update Payment record
  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      merchantReference,
      orderTrackingId: result.order_tracking_id,
      amount: booking.totalAmount,
    },
    update: {
      merchantReference,
      orderTrackingId: result.order_tracking_id,
      status: "PENDING",
    },
  });

  return NextResponse.json({ redirectUrl: result.redirect_url });
}
