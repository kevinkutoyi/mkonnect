// app/api/auth/become-model/route.ts
// Upgrades a VISITOR account to MASSEUSE so they can set up a model profile.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.user.role !== "VISITOR") {
    return NextResponse.json({ error: "Only visitor accounts can become models" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { role: "MASSEUSE" },
  });

  return NextResponse.json({ ok: true });
}
