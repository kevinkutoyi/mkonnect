// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",   // prevents invisible text during font load
  preload: true,
});

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://mconnect.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),   // required for absolute OG image URLs
  title: {
    default: "modelsraha — Find Professional Models in Kenya",
    template: "%s | modelsraha",
  },
  description:
    "Discover and book professional massage services across Kenya. Browse verified models in Nairobi, Mombasa, Kisumu and more.",
  keywords: ["massage Kenya", "model Nairobi", "massage services", "spa Kenya", "wellness Kenya", "body massage Nairobi", "massage booking Kenya"],
  openGraph: {
    type:     "website",
    locale:   "en_KE",
    url:      BASE_URL,
    siteName: "modelsraha",
    images: [
      {
        url:    "/og-default.jpg",   // place a 1200×630 image in /public
        width:  1200,
        height: 630,
        alt:    "modelsraha — Professional Massage Services in Kenya",
      },
    ],
  },
  twitter: {
    card:    "summary_large_image",
    site:    "@mconnectke",
    creator: "@mconnectke",
  },
  robots: {
    index:               true,
    follow:              true,
    googleBot: {
      index:             true,
      follow:            true,
      "max-image-preview": "large",
      "max-snippet":     -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    google: "wiJvoizaCjsg5Elj0joF2VGxjDh6e2SD9GGiHUoutHs",
  },
};

// Organization structured data — sitewide
const organizationSchema = {
  "@context": "https://schema.org",
  "@type":    "Organization",
  name:       "modelsraha",
  url:        BASE_URL,
  logo:       `${BASE_URL}/logo.png`,
  sameAs: [
    "https://twitter.com/mconnectke",
    // add Facebook, Instagram URLs here
  ],
  contactPoint: {
    "@type":             "ContactPoint",
    contactType:         "customer service",
    availableLanguage:   ["English", "Swahili"],
    areaServed:          "KE",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-KLTR4RWNCB"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KLTR4RWNCB');
        `}
      </Script>
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
