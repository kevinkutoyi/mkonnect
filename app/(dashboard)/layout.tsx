// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, User, MapPin, Tag, Banknote, Images } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/dashboard",             label: "Overview",      icon: LayoutDashboard },
  { href: "/dashboard/onboarding",  label: "My Profile",    icon: User            },
  { href: "/dashboard/photos",      label: "Photos & Video", icon: Images          },
  { href: "/dashboard/listing",     label: "Listing Plan",  icon: Tag             },
  { href: "/dashboard/payouts",     label: "Payouts",       icon: Banknote        },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") redirect("/");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
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

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-5xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
