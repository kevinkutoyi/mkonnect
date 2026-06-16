// app/api/admin/reviews/route.ts
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url    = new URL(req.url);
  const status = (url.searchParams.get("status") ?? "HIDDEN") as any;
  const page   = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const take   = 20;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where:   { status },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * take,
      take,
      include: {
        client:  { select: { name: true, email: true } },
        profile: { select: { slug: true, user: { select: { name: true } } } },
      },
    }),
    prisma.review.count({ where: { status } }),
  ]);

  return NextResponse.json({ reviews, total, page });
}
