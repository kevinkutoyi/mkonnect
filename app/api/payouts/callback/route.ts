// app/api/payouts/callback/route.ts
// Daraja posts the B2C result here.
// ?type=result  — payment succeeded or failed
// ?type=timeout — Daraja couldn't process in time (treat as FAILED, retry later)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseB2CResult, MpesaError } from "@/lib/mpesa";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "result";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Bad JSON" }, { status: 400 });
  }

  // ── Timeout ─────────────────────────────────────────────────────────────────
  if (type === "timeout") {
    const convId = (body as any)?.Result?.ConversationID;
    console.warn("[Payout/Callback] Timeout received", convId);

    if (convId) {
      await prisma.payout
        .update({
          where: { darajaConversationId: convId },
          data:  { status: "FAILED", failureReason: "Daraja timeout" },
        })
        .catch(() => {}); // ignore if not found
    }

    // Daraja expects 200 + ResultCode:0 to stop retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Timeout acknowledged" });
  }

  // ── Result ───────────────────────────────────────────────────────────────────
  try {
    const result = parseB2CResult(body);

    const payout = await prisma.payout.findUnique({
      where: { darajaConversationId: result.conversationId },
    });

    if (!payout) {
      // Could be a test callback from Daraja — log and acknowledge
      console.warn("[Payout/Callback] Unknown conversationId:", result.conversationId);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Unknown conversation" });
    }

    if (result.resultCode === 0) {
      // ── Success ────────────────────────────────────────────────────────────
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status:            "COMPLETED",
          mpesaReceiptNumber: result.mpesaReceiptNumber,
          darajaResultCode:  result.resultCode,
          darajaResultDesc:  result.resultDesc,
          processedAt:       new Date(),
        },
      });

      console.info(
        `[Payout/Callback] COMPLETED payout ${payout.id} ` +
        `receipt=${result.mpesaReceiptNumber} amount=${result.transactionAmount}`
      );
    } else {
      // ── Failed ─────────────────────────────────────────────────────────────
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status:           "FAILED",
          darajaResultCode: result.resultCode,
          darajaResultDesc: result.resultDesc,
          failureReason:    result.resultDesc,
        },
      });

      console.warn(
        `[Payout/Callback] FAILED payout ${payout.id} ` +
        `code=${result.resultCode} desc="${result.resultDesc}"`
      );
    }
  } catch (err) {
    const msg = err instanceof MpesaError ? err.message : String(err);
    console.error("[Payout/Callback] Parse error:", msg);
  }

  // Always return 200 with ResultCode:0 so Daraja stops retrying
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
