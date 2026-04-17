import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stripe-account-health-monitor.com"),
  title: "Stripe Account Health Monitor",
  description:
    "Detect sudden Stripe deactivation risks before revenue gets interrupted. Monitor compliance, payout status, and risk indicators in one dashboard.",
  keywords: [
    "Stripe monitoring",
    "Stripe risk alerts",
    "payment operations",
    "compliance monitoring",
    "deactivation prevention",
  ],
  openGraph: {
    title: "Stripe Account Health Monitor",
    description:
      "Real-time Stripe account health dashboard with compliance and risk alerts for teams that rely on uninterrupted payment flow.",
    type: "website",
    url: "https://stripe-account-health-monitor.com",
    siteName: "Stripe Account Health Monitor",
    images: [
      {
        url: "https://stripe-account-health-monitor.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stripe Account Health Monitor dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stripe Account Health Monitor",
    description: "Monitor Stripe account health and catch deactivation risk before it impacts cash flow.",
    images: ["https://stripe-account-health-monitor.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  applicationName: "Stripe Account Health Monitor",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={spaceGrotesk.variable}>{children}</body>
    </html>
  );
}
