// app/api/admin/profiles/[id]/route.ts
// PATCH — update verificationLevel (admin only)
import { NextResponse } from "next/server";
import { z }            from "zod";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

interface Ctx { params: { id: string } }

const Schema = z.object({
  verificationLevel: z.enum([
    "UNVERIFIED",
    "EMAIL_VERIFIED",
    "PHONE_VERIFIED",
    "ID_VERIFIED",
    "FULLY_VERIFIED",
  ]),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await prisma.masseuseProfile.update({
    where: { id: params.id },
    data:  { verificationLevel: parsed.data.verificationLevel },
    select: { id: true, verificationLevel: true },
  });

  // Audit log
  await prisma.adminAction.create({
    data: {
      adminId:         session.user.id,
      targetProfileId: params.id,
      actionType:      "PROFILE_APPROVED", // closest available type
      notes:           `Verification level set to ${parsed.data.verificationLevel}`,
    },
  });

  return NextResponse.json(profile);
}
