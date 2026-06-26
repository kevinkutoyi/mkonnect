// app/api/admin/activate-approved/route.ts
// One-time POST to bulk-activate all APPROVED profiles that are not yet listed.
// Safe to call multiple times — idempotent.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.masseuseProfile.updateMany({
    where: { status: "APPROVED", listingActive: false },
    data:  { listingActive: true },
  });

  return NextResponse.json({
    ok:        true,
    activated: result.count,
    message:   `${result.count} profile(s) activated`,
  });
}
