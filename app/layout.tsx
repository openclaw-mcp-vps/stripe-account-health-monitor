import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stripe-account-health-monitor.com"),
  title: {
    default: "Stripe Account Health Monitor",
    template: "%s | Stripe Account Health Monitor"
  },
  description:
    "Monitor Stripe account for sudden deactivation risks with dispute analytics, compliance flag tracking, and instant alerts before payment processing goes down.",
  keywords: [
    "Stripe monitoring",
    "chargeback monitoring",
    "dispute analytics",
    "SaaS payments",
    "ecommerce risk monitoring",
    "Stripe deactivation prevention"
  ],
  openGraph: {
    title: "Stripe Account Health Monitor",
    description:
      "24/7 Stripe account risk monitoring for SaaS founders and ecommerce operators. Detect deactivation risk early and protect revenue.",
    type: "website",
    url: "/",
    siteName: "Stripe Account Health Monitor"
  },
  twitter: {
    card: "summary_large_image",
    title: "Stripe Account Health Monitor",
    description:
      "Stay ahead of Stripe deactivation risk with live health metrics and proactive alerts."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
