// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, User, MapPin, Tag, Banknote, Images } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/dashboard",             label: "Overview",       icon: LayoutDashboard },
  { href: "/dashboard/onboarding",  label: "My Profile",     icon: User            },
  { href: "/dashboard/photos",      label: "Photos & Video", icon: Images          },
  { href: "/dashboard/listing",     label: "Listing Plan",   icon: Tag             },
  { href: "/dashboard/payouts",     label: "Payouts",        icon: Banknote        },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") redirect("/");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-lg">
            <MapPin className="h-4 w-4 text-primary" />
            modelsraha
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">{session.user.name}</span>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Top bar — mobile only */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
          <Link href="/" className="flex items-center gap-1.5 font-bold">
            <MapPin className="h-4 w-4 text-primary" />
            modelsraha
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="container mx-auto max-w-5xl px-4 py-6 lg:py-8">{children}</div>
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card lg:hidden">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-none">{label.split(" ")[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
