// app/api/admin/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ApproveSchema = z.object({
  profileId: z.string(),
  action: z.enum(["APPROVE", "SUSPEND", "PENDING"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const statusMap = { APPROVE: "APPROVED", SUSPEND: "SUSPENDED", PENDING: "PENDING" } as const;

  const profile = await prisma.masseuseProfile.update({
    where: { id: parsed.data.profileId },
    data: { status: statusMap[parsed.data.action] },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(profile);
}
