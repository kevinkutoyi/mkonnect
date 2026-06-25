// lib/direct-payment.ts
// Shared processor for direct client-to-model Paystack payments.

import { prisma } from "@/lib/prisma";
import { verifyTransaction, PaystackError } from "@/lib/paystack";

export type DirectPaymentOutcome = "COMPLETED" | "FAILED" | "PENDING";

export async function processDirectPayment(reference: string): Promise<DirectPaymentOutcome> {
  const payment = await prisma.directPayment.findUnique({ where: { reference } });
  if (!payment) return "FAILED";
  if (payment.status === "COMPLETED") return "COMPLETED";
  if (payment.status === "FAILED")    return "FAILED";

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (err) {
    if (err instanceof PaystackError) return "PENDING";
    throw err;
  }

  if (tx.status === "success") {
    await prisma.directPayment.update({
      where: { reference },
      data:  { status: "COMPLETED", paidAt: new Date() },
    });
    return "COMPLETED";
  }

  if (tx.status === "failed" || tx.status === "abandoned") {
    await prisma.directPayment.update({
      where: { reference },
      data:  { status: "FAILED" },
    });
    return "FAILED";
  }

  return "PENDING";
}
