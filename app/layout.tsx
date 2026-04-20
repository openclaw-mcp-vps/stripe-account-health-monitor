import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stripe-account-health-monitor.vercel.app"),
  title: "Stripe Account Health Monitor | Prevent Stripe Deactivation",
  description:
    "Monitor chargeback rates, dispute velocity, and compliance flags before Stripe account issues freeze your revenue.",
  keywords: [
    "Stripe account health",
    "Stripe deactivation prevention",
    "chargeback monitoring",
    "dispute alerts",
    "SaaS finance operations",
  ],
  openGraph: {
    title: "Stripe Account Health Monitor",
    description:
      "24/7 Stripe risk monitoring with proactive alerts for chargebacks, disputes, and compliance flags.",
    type: "website",
    siteName: "Stripe Account Health Monitor",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stripe Account Health Monitor",
    description:
      "Get early warnings before Stripe account health issues impact your cash flow.",
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
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
