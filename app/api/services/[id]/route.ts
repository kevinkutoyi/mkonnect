// app/api/services/[id]/route.ts
// GET    — fetch single service
// PATCH  — update service
// DELETE — delete service

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateServiceSchema } from "@/lib/validations/service";
import { updateProfilePriceRange } from "@/lib/services";

// ─── Shared ownership guard ───────────────────────────────────────────────────
async function getOwnedService(id: string, userId: string) {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      profile: { select: { id: true, userId: true } },
      category: { select: { id: true, name: true, icon: true, type: true } },
    },
  });

  if (!service) return { service: null, error: "Service not found", status: 404 };
  if (service.profile.userId !== userId) {
    return { service: null, error: "Forbidden", status: 403 };
  }
  return { service, error: null, status: 200 };
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { service, error, status } = await getOwnedService(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  return NextResponse.json(service);
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { service, error, status } = await getOwnedService(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const parsed = UpdateServiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { studioLocation, discountPrice, depositAmount, ...rest } = parsed.data;

  const updated = await prisma.service.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(studioLocation !== undefined ? { studioLocation } : {}),
      ...(discountPrice  !== undefined ? { discountPrice:  discountPrice  ?? null } : {}),
      ...(depositAmount  !== undefined ? { depositAmount:  depositAmount  ?? null } : {}),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, type: true } },
    },
  });

  await updateProfilePriceRange(service!.profile.id);

  return NextResponse.json(updated);
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { service, error, status } = await getOwnedService(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  // Soft-delete: check for active bookings first
  const upcomingBookings = await prisma.booking.count({
    where: {
      serviceId: params.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      scheduledAt: { gte: new Date() },
    },
  });

  if (upcomingBookings > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this service has ${upcomingBookings} upcoming booking(s). Deactivate it instead.` },
      { status: 409 }
    );
  }

  await prisma.service.delete({ where: { id: params.id } });
  await updateProfilePriceRange(service!.profile.id);

  return NextResponse.json({ message: "Service deleted." });
}
