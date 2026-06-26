// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const role   = searchParams.get("role") ?? "";

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name:  { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(users);
  } catch (err: any) {
    console.error("[admin/users GET]", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 422 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, role, password } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 422 });

  // ── Role change ────────────────────────────────────────────────────────────
  if (role) {
    if (!["VISITOR", "MASSEUSE", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 422 });
    }
    await prisma.user.update({ where: { id }, data: { role } });
    return NextResponse.json({ ok: true, updated: "role" });
  }

  // ── Password reset ─────────────────────────────────────────────────────────
  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });
    }
    const bcrypt = await import("bcryptjs");
    const hash   = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id }, data: { password: hash } });
    return NextResponse.json({ ok: true, updated: "password" });
  }

  return NextResponse.json({ error: "role or password required" }, { status: 422 });
}
