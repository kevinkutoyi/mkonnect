// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "mconnect — Find Professional Masseuses in Kenya",
    template: "%s | mconnect",
  },
  description:
    "Discover and book professional massage services across Kenya. Browse verified masseuses in Nairobi, Mombasa, Kisumu and more.",
  keywords: ["massage Kenya", "masseuse Nairobi", "massage services", "spa Kenya", "wellness Kenya"],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://mconnect.co.ke",
    siteName: "mconnect",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
