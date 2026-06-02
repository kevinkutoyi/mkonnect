// components/layout/Footer.tsx
import Link from "next/link";
import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-10">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-1.5 font-bold text-lg mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              m<span className="text-primary">connect</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Kenya's platform for professional massage services.
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-sm">For Clients</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-foreground">Find a Masseuse</Link></li>
              <li><Link href="/search?location=nairobi" className="hover:text-foreground">Nairobi</Link></li>
              <li><Link href="/search?location=mombasa" className="hover:text-foreground">Mombasa</Link></li>
              <li><Link href="/search?location=kisumu" className="hover:text-foreground">Kisumu</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-sm">For Masseuses</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground">Join mconnect</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} mconnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
