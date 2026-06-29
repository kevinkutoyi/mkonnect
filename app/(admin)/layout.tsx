// app/(admin)/layout.tsx
import { auth }        from "@/lib/auth";
import { redirect }    from "next/navigation";
import Link            from "next/link";
import { prisma }      from "@/lib/prisma";
import { MapPin, ExternalLink } from "lucide-react";
import { SidebarNav }  from "@/components/admin/SidebarNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  // Badge counts — pending items that need attention
  const [pendingProfiles, pendingReviews, pendingPayments] = await Promise.all([
    prisma.masseuseProfile.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "HIDDEN" } }),
    prisma.profileSubscription.count({ where: { status: "PENDING" } }),
  ]);

  const badges: Record<string, number> = {
    "/admin/masseuses": pendingProfiles,
    "/admin/reviews":   pendingReviews,
    "/admin/payments":  pendingPayments,
  };

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-tight">modelsraha</span>
          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Admin
          </span>
        </div>
        <SidebarNav email={session.user.email!} badges={badges} />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
          <p className="text-sm font-semibold text-muted-foreground">Admin Panel</p>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View site
          </Link>
        </header>
        <main className="flex-1 px-6 py-8 overflow-auto">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
