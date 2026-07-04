// app/api/admin/newsletter/route.ts
// GET  — subscriber counts per audience
// POST — send broadcast to a specific audience
import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { sendNewsletterBatch }       from "@/lib/email";
import { z }                         from "zod";

const BATCH_SIZE = 100;

function unsubToken(userId: string) {
  return Buffer.from(userId).toString("base64url");
}

// Prisma role filter per audience
function roleFilter(audience: string) {
  if (audience === "MODELS")  return { role: "MASSEUSE" as const };
  if (audience === "CLIENTS") return { role: { in: ["VISITOR", "CLIENT"] as const } };
  return {}; // ALL — no role filter
}

// GET — return subscriber counts for each audience
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base = { newsletterSubscribed: true, isActive: true };

  const [all, models, clients] = await Promise.all([
    prisma.user.count({ where: base }),
    prisma.user.count({ where: { ...base, role: "MASSEUSE" } }),
    prisma.user.count({ where: { ...base, role: { in: ["VISITOR", "CLIENT"] } } }),
  ]);

  return NextResponse.json({ all, models, clients });
}

const SendSchema = z.object({
  subject:  z.string().min(1).max(200),
  bodyHtml: z.string().min(1),
  audience: z.enum(["ALL", "MODELS", "CLIENTS"]),
});

// POST — broadcast email to the selected audience
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { subject, bodyHtml, audience } = parsed.data;

  const subscribers = await prisma.user.findMany({
    where:  { newsletterSubscribed: true, isActive: true, ...roleFilter(audience) },
    select: { id: true, name: true, email: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0 });
  }

  let totalSent   = 0;
  let totalFailed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE).map((u) => ({
      email:            u.email,
      name:             u.name,
      unsubscribeToken: unsubToken(u.id),
    }));

    const result = await sendNewsletterBatch({ recipients: chunk, subject, bodyHtml });
    totalSent   += result.sent;
    totalFailed += result.failed;
  }

  await prisma.adminAction.create({
    data: {
      adminId:    session.user.id,
      actionType: "PROFILE_APPROVED",
      notes:      `Newsletter broadcast [${audience}]: "${subject}" — ${totalSent} sent, ${totalFailed} failed`,
    },
  });

  return NextResponse.json({ sent: totalSent, failed: totalFailed, total: subscribers.length });
}
