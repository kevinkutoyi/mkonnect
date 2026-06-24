"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, MapPin } from "lucide-react";
import { getInitials } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [becomingModel, setBecomingModel] = useState(false);
  const router = useRouter();

  const handleBecomeModel = async () => {
    setBecomingModel(true);
    try {
      const res = await fetch("/api/auth/become-model", { method: "POST" });
      if (!res.ok) throw new Error();
      router.push("/auth/refresh?role=MASSEUSE&dest=/dashboard/onboarding");
    } catch {
      setBecomingModel(false);
    }
  };

  const dashboardHref =
    session?.user.role === "ADMIN"    ? "/admin"     :
    session?.user.role === "MASSEUSE" ? "/dashboard" : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-xl text-primary">modelsraha</span>
            <span className="text-[9px] font-medium text-muted-foreground tracking-wide hidden sm:block">
              Find your perfect model match
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          <Link href="/videos" className="text-muted-foreground hover:text-foreground transition-colors">
            Videos
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
              {session.user.role === "VISITOR" && (
                <button
                  onClick={handleBecomeModel}
                  disabled={becomingModel}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {becomingModel ? "Please wait…" : "Become a Model"}
                </button>
              )}
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
              <Link href="/auth/login" className="text-sm font-medium hover:text-primary">
                Log in
              </Link>
              <Link
                href="/auth/register"
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
            <Link href="/videos" onClick={() => setMenuOpen(false)}>Videos</Link>
            {dashboardHref && (
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            {session ? (
              <>
                {session.user.role === "VISITOR" && (
                  <button
                    onClick={handleBecomeModel}
                    disabled={becomingModel}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-center"
                  >
                    {becomingModel ? "Please wait…" : "Become a Model"}
                  </button>
                )}
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
