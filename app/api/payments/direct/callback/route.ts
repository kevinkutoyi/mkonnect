// app/api/payments/direct/callback/route.ts
// GET — browser redirect after Paystack direct payment

import { NextRequest, NextResponse } from "next/server";
import { processDirectPayment } from "@/lib/direct-payment";

export async function GET(req: NextRequest) {
  const base      = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const reference = req.nextUrl.searchParams.get("reference")
    ?? req.nextUrl.searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(new URL("/?payment=failed", base));
  }

  try {
    const outcome = await processDirectPayment(reference);
    if (outcome === "COMPLETED") {
      return NextResponse.redirect(new URL(`/?payment=success`, base));
    }
    return NextResponse.redirect(new URL(`/?payment=failed`, base));
  } catch {
    return NextResponse.redirect(new URL("/?payment=failed", base));
  }
}
