// app/api/admin/masseuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status   = searchParams.get("status") as any;
  const search   = searchParams.get("search") ?? "";
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const take     = 20;

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { user: { name:  { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [profiles, total] = await Promise.all([
    prisma.masseuseProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * take,
      take,
      include: {
        user:   { select: { id: true, name: true, email: true, phone: true } },
        city:   { include: { county: true } },
        photos: { where: { isCover: true }, take: 1 },
      },
    }),
    prisma.masseuseProfile.count({ where }),
  ]);

  return NextResponse.json({ profiles, total, page });
}
