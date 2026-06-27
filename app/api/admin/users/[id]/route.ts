// app/api/admin/users/[id]/route.ts
// GET  — fetch a single user's editable fields
// PATCH — update name, email, phone, password, role

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: params.id },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, email, phone, password, role } = body;

  // Build update payload — only include fields that were sent
  const data: Record<string, any> = {};

  if (name !== undefined) {
    if (!name?.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 422 });
    data.name = name.trim();
  }

  if (email !== undefined) {
    if (!email?.trim()) return NextResponse.json({ error: "Email cannot be empty" }, { status: 422 });
    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { email: email.trim(), NOT: { id: params.id } },
    });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    data.email = email.trim();
  }

  if (phone !== undefined) {
    if (phone?.trim()) {
      // Check uniqueness
      const existing = await prisma.user.findFirst({
        where: { phone: phone.trim(), NOT: { id: params.id } },
      });
      if (existing) return NextResponse.json({ error: "Phone number already in use" }, { status: 409 });
      data.phone = phone.trim();
    } else {
      data.phone = null; // allow clearing phone
    }
  }

  if (role !== undefined) {
    if (!["VISITOR", "MASSEUSE", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 422 });
    }
    data.role = role;
  }

  if (password !== undefined) {
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });
    }
    const bcrypt = await import("bcryptjs");
    data.password = await bcrypt.hash(password, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  const updated = await prisma.user.update({
    where:  { id: params.id },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
