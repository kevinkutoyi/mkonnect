// app/api/admin/profiles/[id]/route.ts
// PATCH — update verificationLevel and/or listingActive (admin only)
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
  ]).optional(),
  listingActive: z.boolean().optional(),
}).refine(
  (d) => d.verificationLevel !== undefined || d.listingActive !== undefined,
  { message: "At least one field is required" }
);

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

  const updateData: Record<string, unknown> = {};
  if (parsed.data.verificationLevel !== undefined) {
    updateData.verificationLevel = parsed.data.verificationLevel;
  }
  if (parsed.data.listingActive !== undefined) {
    updateData.listingActive = parsed.data.listingActive;
  }

  const profile = await prisma.masseuseProfile.update({
    where:  { id: params.id },
    data:   updateData,
    select: { id: true, verificationLevel: true, listingActive: true },
  });

  // Audit log
  const notes: string[] = [];
  if (parsed.data.verificationLevel !== undefined) {
    notes.push(`Verification level → ${parsed.data.verificationLevel}`);
  }
  if (parsed.data.listingActive !== undefined) {
    notes.push(`Listing ${parsed.data.listingActive ? "enabled (listed)" : "disabled (unlisted)"} by admin`);
  }

  await prisma.adminAction.create({
    data: {
      adminId:         session.user.id,
      targetProfileId: params.id,
      actionType:      "PROFILE_APPROVED", // closest available type
      notes:           notes.join("; "),
    },
  });

  return NextResponse.json(profile);
}
