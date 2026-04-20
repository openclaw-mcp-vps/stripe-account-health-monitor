import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stripe-account-health-monitor.example.com"),
  title: {
    default: "Stripe Account Health Monitor",
    template: "%s | Stripe Account Health Monitor",
  },
  description:
    "Monitor Stripe account risk signals around disputes, chargebacks, payouts, and compliance before deactivation freezes your revenue.",
  keywords: [
    "Stripe monitoring",
    "chargeback alerts",
    "Stripe deactivation risk",
    "SaaS payments",
    "e-commerce risk monitoring",
  ],
  openGraph: {
    title: "Stripe Account Health Monitor",
    description:
      "Get early warning alerts before Stripe account risk issues turn into payment freezes.",
    url: "https://stripe-account-health-monitor.example.com",
    siteName: "Stripe Account Health Monitor",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Stripe account risk dashboard preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stripe Account Health Monitor",
    description:
      "Prevent surprise Stripe freezes with real-time account health monitoring and alerts.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
