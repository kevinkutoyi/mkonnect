"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldCheck, CreditCard,
  Star, Tag, MapPin, Banknote,
} from "lucide-react";

const NAV = [
  { href: "/admin",           label: "Overview",  icon: LayoutDashboard },
  { href: "/admin/masseuses", label: "Profiles",  icon: ShieldCheck     },
  { href: "/admin/reviews",   label: "Reviews",   icon: Star            },
  { href: "/admin/payments",  label: "Payments",  icon: CreditCard      },
  { href: "/admin/payouts",   label: "Payouts",   icon: Banknote        },
  { href: "/admin/users",     label: "Users",     icon: Users           },
  { href: "/admin/tiers",     label: "Tiers",     icon: Tag             },
];

interface Props {
  email: string;
  badges?: Record<string, number>;
}

export function SidebarNav({ email, badges = {} }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const badge  = badges[href];
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
              {badge != null && badge > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {email[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{email}</p>
            <p className="text-[10px] text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </>
  );
}
