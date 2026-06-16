// app/api/payments/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/pesapal";

// Pesapal IPN — POST with orderTrackingId + orderMerchantReference
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderTrackingId, orderMerchantReference } = body;

    if (!orderTrackingId || !orderMerchantReference) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const txStatus = await getTransactionStatus(orderTrackingId);

    const payment = await prisma.payment.findUnique({
      where: { merchantReference: orderMerchantReference },
      include: { booking: true },
    });

    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    // status_code: 2 = Completed, 3 = Failed, 4 = Reversed
    const paymentStatus =
      txStatus.status_code === 2
        ? "COMPLETED"
        : txStatus.status_code === 3
        ? "FAILED"
        : txStatus.status_code === 4
        ? "REFUNDED"
        : "PENDING";

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          metadata: { payment_method: txStatus.payment_method },
          orderTrackingId,
        },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: paymentStatus === "COMPLETED" ? "CONFIRMED" : "PENDING",
        },
      }),
    ]);

    return NextResponse.json({ orderNotificationType: "IPNCHANGE", orderTrackingId, orderMerchantReference, status: "200" });
  } catch (err) {
    console.error("[Pesapal IPN Error]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Pesapal also calls GET for redirect
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.redirect(new URL("/booking/confirmation?status=failed", req.url));
  }

  const txStatus = await getTransactionStatus(orderTrackingId).catch(() => null);
  const isSuccess = txStatus?.status_code === 2;

  const url = new URL("/booking/confirmation", req.url);
  url.searchParams.set("status", isSuccess ? "success" : "failed");
  url.searchParams.set("ref", merchantReference);
  return NextResponse.redirect(url);
}
