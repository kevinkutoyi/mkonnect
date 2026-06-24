// lib/video-payment.ts
// Shared processor for Paystack video unlock payments.
// Used by both /api/videos/callback (GET redirect) and /api/tiers/callback (POST webhook).

import { prisma } from "@/lib/prisma";
import { verifyTransaction, PaystackError } from "@/lib/paystack";

export type VideoPaymentOutcome = "COMPLETED" | "FAILED" | "PENDING";

export async function processVideoPayment(reference: string): Promise<VideoPaymentOutcome> {
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
