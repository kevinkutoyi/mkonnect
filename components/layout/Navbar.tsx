"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, MapPin } from "lucide-react";
import { getInitials } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref =
    session?.user.role === "ADMIN"    ? "/admin"     :
    session?.user.role === "MASSEUSE" ? "/dashboard" : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 font-bold text-xl">
          <MapPin className="h-5 w-5 text-primary" />
          models<span className="text-primary">raha</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          {dashboardHref && (
            <Link href={dashboardHref} className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          )}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              <NotificationBell />
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {getInitials(session.user.name)}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-md p-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-background px-6 py-4">
          <div className="flex flex-col gap-4 text-sm">
            <Link href="/search" onClick={() => setMenuOpen(false)}>Browse</Link>
            {dashboardHref && (
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-left"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
