// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateBookingSchema = z.object({
  profileId: z.string(),
  serviceId: z.string(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    session.user.role === "CLIENT"
      ? { clientId: session.user.id }
      : session.user.role === "MASSEUSE"
      ? { profile: { userId: session.user.id } }
      : {}; // ADMIN sees all

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true } },
      service: true,
      payment: { select: { id: true, status: true, merchantReference: true, orderTrackingId: true } },
      review: { select: { id: true, ratingOverall: true, comment: true } },
    },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: parsed.data.serviceId, profileId: parsed.data.profileId, isActive: true },
  });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const booking = await prisma.booking.create({
    data: {
      clientId: session.user.id,
      profileId: parsed.data.profileId,
      serviceId: parsed.data.serviceId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      notes: parsed.data.notes,
      totalAmount: service.price,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
