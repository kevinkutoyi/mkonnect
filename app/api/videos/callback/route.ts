// app/api/videos/callback/route.ts
// GET  — browser redirect after Paystack video unlock payment
// POST — Paystack webhook (unified handler also handles subscriptions)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction, verifyWebhookSignature, PaystackError } from "@/lib/paystack";

// ── GET: browser redirect after payment ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const reference = req.nextUrl.searchParams.get("reference")
    ?? req.nextUrl.searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(new URL("/videos?status=failed", base));
  }

  try {
    const outcome = await processVideoPayment(reference);
    const unlock  = await prisma.videoUnlock.findUnique({
      where:  { reference },
      select: { videoId: true },
    });
    const videoId = unlock?.videoId ?? "";

    if (outcome === "COMPLETED") {
      return NextResponse.redirect(
        new URL(`/videos?status=success&videoId=${videoId}`, base)
      );
    }
    return NextResponse.redirect(
      new URL(`/videos?status=failed`, base)
    );
  } catch {
    return NextResponse.redirect(new URL("/videos?status=failed", base));
  }
}

// ── POST: Paystack webhook ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const reference = event.data?.reference;
    const type      = event.data?.metadata?.type;

    if (type === "video_unlock") {
      await processVideoPayment(reference);
    }
    // subscription payments handled by /api/tiers/callback webhook

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Video Webhook]", err);
    return NextResponse.json({ received: true });
  }
}

// ── Core processor ────────────────────────────────────────────────────────────
async function processVideoPayment(reference: string): Promise<"COMPLETED" | "FAILED" | "PENDING"> {
  const unlock = await prisma.videoUnlock.findUnique({ where: { reference } });
  if (!unlock) return "FAILED";
  if (unlock.status === "COMPLETED") return "COMPLETED";
  if (unlock.status === "FAILED")    return "FAILED";

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (err) {
    if (err instanceof PaystackError) return "PENDING";
    throw err;
  }

  if (tx.status === "success") {
    await prisma.$transaction([
      prisma.videoUnlock.update({
        where: { reference },
        data:  { status: "COMPLETED", paidAt: new Date() },
      }),
      prisma.premiumVideo.update({
        where: { id: unlock.videoId },
        data:  { unlockCount: { increment: 1 } },
      }),
    ]);
    return "COMPLETED";
  }

  if (tx.status === "failed" || tx.status === "abandoned") {
    await prisma.videoUnlock.update({
      where: { reference },
      data:  { status: "FAILED" },
    });
    return "FAILED";
  }

  return "PENDING";
}
