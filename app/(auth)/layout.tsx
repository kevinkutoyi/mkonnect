// app/(auth)/layout.tsx
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — branding / illustration (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
          <MapPin className="h-6 w-6" />
          modelsraha
        </Link>
        <blockquote className="space-y-4">
          <p className="text-xl leading-relaxed font-light">
            "Kenya's trusted marketplace for professional massage services —
            connecting wellness seekers with certified therapists across every county."
          </p>
          <footer className="text-primary-foreground/70 text-sm">
            modelsraha Platform
          </footer>
        </blockquote>
        <p className="text-primary-foreground/50 text-xs">
          © {new Date().getFullYear()} modelsraha. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="text-primary">modelsraha</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
