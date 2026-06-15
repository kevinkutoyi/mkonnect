// app/(admin)/layout.tsx
import { auth }     from "@/lib/auth";
import { redirect } from "next/navigation";
import Link         from "next/link";
import {
  LayoutDashboard, Users, ShieldCheck, CreditCard,
  Star, Tag, MapPin, Bell,
} from "lucide-react";

const NAV = [
  { href: "/admin",           label: "Overview",    icon: LayoutDashboard },
  { href: "/admin/masseuses", label: "Profiles",    icon: ShieldCheck     },
  { href: "/admin/reviews",   label: "Reviews",     icon: Star            },
  { href: "/admin/payments",  label: "Payments",    icon: CreditCard      },
  { href: "/admin/users",     label: "Users",       icon: Users           },
  { href: "/admin/tiers",     label: "Tiers",       icon: Tag             },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-bold tracking-tight">modelsraha admin</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            Signed in as<br />
            <span className="font-semibold text-foreground">{session.user.email}</span>
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <h1 className="font-semibold">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← View site
            </Link>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
