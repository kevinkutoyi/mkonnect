// components/layout/Footer.tsx
import Link from "next/link";
import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 pt-10 pb-6">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 font-bold text-lg mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              models<span className="text-primary">raha</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kenya's platform for professional massage services.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h3 className="font-semibold text-sm mb-3">For Clients</h3>
            <ul className="space-y-2">
              {[
                { label: "Find a Masseuse", href: "/search" },
                { label: "Nairobi",         href: "/search?location=nairobi" },
                { label: "Mombasa",         href: "/search?location=mombasa" },
                { label: "Kisumu",          href: "/search?location=kisumu" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Masseuses */}
          <div>
            <h3 className="font-semibold text-sm mb-3">For Masseuses</h3>
            <ul className="space-y-2">
              {[
                { label: "Join modelsraha", href: "/register" },
                { label: "Dashboard",    href: "/dashboard" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} modelsraha. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
