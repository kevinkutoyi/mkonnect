// app/api/admin/newsletter/route.ts
// GET  — subscriber count
// POST — send broadcast to all newsletter subscribers
import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { sendNewsletterBatch }       from "@/lib/email";
import { z }                         from "zod";

const BATCH_SIZE = 100;

function unsubToken(userId: string) {
  return Buffer.from(userId).toString("base64url");
}

// GET — return subscriber count
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const count = await prisma.user.count({ where: { newsletterSubscribed: true } });
  return NextResponse.json({ count });
}

const SendSchema = z.object({
  subject:  z.string().min(1).max(200),
  bodyHtml: z.string().min(1),
});

// POST — broadcast email
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

  const { subject, bodyHtml } = parsed.data;

  // Fetch all active newsletter subscribers
  const subscribers = await prisma.user.findMany({
    where:  { newsletterSubscribed: true, isActive: true },
    select: { id: true, name: true, email: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0 });
  }

  // Chunk into batches of 100 (Resend limit)
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

  // Log the broadcast as an admin action
  await prisma.adminAction.create({
    data: {
      adminId:    session.user.id,
      actionType: "PROFILE_APPROVED", // closest available; schema doesn't have NEWSLETTER type
      notes:      `Newsletter broadcast: "${subject}" — ${totalSent} sent, ${totalFailed} failed`,
    },
  });

  return NextResponse.json({
    sent:   totalSent,
    failed: totalFailed,
    total:  subscribers.length,
  });
}
