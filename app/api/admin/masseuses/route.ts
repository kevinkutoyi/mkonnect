// app/api/admin/masseuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") as any;
  const where = status ? { status } : {};

  const profiles = await prisma.masseuseProfile.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      location: true,
    },
  });

  return NextResponse.json(profiles);
}
