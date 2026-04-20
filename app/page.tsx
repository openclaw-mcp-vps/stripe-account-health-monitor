import Link from "next/link";
import Script from "next/script";

import { ArrowRight, BellRing, ShieldAlert, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How does this help prevent Stripe shutdowns?",
    answer:
      "The monitor tracks Stripe's risk-sensitive signals every 15 minutes, including dispute pressure, compliance requirements, and payout failures. You get early warnings before those signals compound into account restrictions."
  },
  {
    question: "Do I need a separate Stripe app?",
    answer:
      "No. You provide your Stripe secret key in environment variables and connect your account from the dashboard. The monitor then pulls metrics directly from Stripe's API."
  },
  {
    question: "Can I get alerts by both email and SMS?",
    answer:
      "Yes. Email alerts are enabled by default. SMS can be turned on in dashboard settings once Twilio credentials are configured."
  },
  {
    question: "What happens after I pay?",
    answer:
      "Lemon Squeezy sends a webhook to this app. We store your purchase email, and you unlock the dashboard by verifying that same email once. Access is then maintained through a signed cookie."
  }
];

const problems = [
  "Disputes can spike in a single weekend and silently push your account into a review queue.",
  "Compliance requirements in Stripe can sit unresolved while checkout continues to process normally.",
  "Most teams only see account risk after payout delays or sudden capability restrictions." 
];

const solutions = [
  {
    title: "15-minute risk polling",
    description:
      "A scheduled monitor cycle fetches Stripe charges, disputes, payout status, and requirements every 15 minutes and stores the historical trend."
  },
  {
    title: "Actionable risk score",
    description:
      "Risk scoring converts raw Stripe events into a 0-100 signal with LOW, MEDIUM, HIGH, and CRITICAL levels so your team can prioritize quickly."
  },
  {
    title: "Threshold-driven alerts",
    description:
      "Configure your own chargeback, dispute, compliance, and risk-score thresholds to trigger email and SMS notifications before revenue gets interrupted."
  }
];

export default function HomePage(): React.JSX.Element {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const checkoutUrl = productId
    ? `https://checkout.lemonsqueezy.com/buy/${productId}?embed=1&media=0&logo=0&checkout[dark]=true&checkout[success_url]=${encodeURIComponent(
        `${appUrl}/thank-you`
      )}`
    : "#pricing";

  return (
    <main className="min-h-screen bg-[#0d1117] text-zinc-100">
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />

      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Stripe Account Health Monitor</p>
            <p className="mt-1 text-sm text-zinc-400">Business Tools • $15/mo</p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary">Dashboard</Button>
          </Link>
        </header>

        <section className="relative mt-16 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-cyan-950/40 via-zinc-950 to-zinc-900 p-8 sm:p-12">
          <div className="absolute -right-12 -top-8 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Monitor Stripe account for sudden deactivation risks
            </h1>
            <p className="mt-5 text-lg text-zinc-300">
              Keep payment processing safe with 24/7 Stripe risk surveillance. Detect dispute pressure,
              compliance exposure, and payout warning signs before Stripe freezes your account.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href={checkoutUrl} className="lemonsqueezy-button">
                <Button size="lg">
                  Start Monitoring for $15/mo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/thank-you">
                <Button size="lg" variant="secondary">
                  I Already Purchased
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                <ShieldAlert className="mb-2 h-4 w-4 text-cyan-300" />
                Early warning on account risk factors
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                <TrendingUp className="mb-2 h-4 w-4 text-cyan-300" />
                30-day trend tracking and risk scoring
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                <BellRing className="mb-2 h-4 w-4 text-cyan-300" />
                Email and SMS escalation alerts
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">The problem this solves</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {problems.map((item) => (
              <Card key={item}>
                <CardContent className="pt-6 text-zinc-300">{item}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {solutions.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-zinc-300">{item.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="mt-16">
          <Card className="border-cyan-900/70 bg-cyan-950/10">
            <CardHeader>
              <CardTitle className="text-3xl">Simple pricing for high-risk revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300">
                <span className="text-4xl font-semibold text-zinc-100">$15</span>
                <span className="ml-2 text-zinc-400">per month</span>
              </p>
              <ul className="mt-5 space-y-2 text-zinc-300">
                <li>24/7 Stripe risk monitoring</li>
                <li>Historical chargeback and dispute trends</li>
                <li>Compliance and payout failure tracking</li>
                <li>Email alerts with optional SMS escalation</li>
                <li>Paywall-protected dashboard access</li>
              </ul>
              <div className="mt-6">
                <a href={checkoutUrl} className="lemonsqueezy-button">
                  <Button size="lg">Subscribe with Lemon Squeezy</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-16 pb-20">
          <h2 className="text-2xl font-semibold">FAQ</h2>
          <div className="mt-6 grid gap-4">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-zinc-300">{faq.answer}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
