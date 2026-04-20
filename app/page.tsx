import Link from "next/link";
import { cookies } from "next/headers";
import {
  AlertTriangle,
  BadgeDollarSign,
  BellRing,
  Check,
  Radar,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "What risk signals does the monitor track?",
    answer:
      "It continuously evaluates chargeback rate, dispute velocity, refund pressure, failed payment spikes, and Stripe compliance requirements like currently_due and past_due fields.",
  },
  {
    question: "How do alerts work?",
    answer:
      "You configure a risk-score threshold. When your score rises above that threshold and beats cooldown rules, the app sends email and/or SMS alerts with the exact risk drivers.",
  },
  {
    question: "Do I need to migrate payments or install Stripe apps?",
    answer:
      "No migration required. You keep your existing Stripe setup and add a restricted read-only key so this dashboard can analyze account health.",
  },
  {
    question: "How does paywall access unlock after purchase?",
    answer:
      "Set your Stripe Payment Link success redirect to /api/stripe/connect?session_id={CHECKOUT_SESSION_ID}. The app verifies payment and sets a secure access cookie for the dashboard.",
  },
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasPaidAccess = cookieStore.get("sahm_paid")?.value === "1";

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#9aa4b2]">
          <Radar className="h-4 w-4 text-[#4fb8ff]" />
          Stripe Account Health Monitor
        </div>
        <div className="flex items-center gap-2">
          {hasPaidAccess ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
          ) : null}
          <Button asChild size="sm">
            <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>Start for $15/month</a>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-[#233043] bg-[#0f172a]/70 p-8 shadow-[0_24px_80px_rgba(2,10,23,0.55)] sm:p-12">
        <div className="pointer-events-none absolute -left-20 top-24 h-60 w-60 rounded-full bg-[#4fb8ff]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -top-10 h-64 w-64 rounded-full bg-[#23c29a]/20 blur-3xl" />

        <div className="relative max-w-3xl space-y-6">
          <span className="inline-flex items-center rounded-full border border-[#32475d] px-3 py-1 text-xs text-[#9fb3c8]">
            Built for SaaS founders and e-commerce operators doing $10K+/month on Stripe
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Monitor Stripe account for sudden deactivation risks
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[#b9c3cf] sm:text-lg">
            Stripe can freeze payment processing with little warning. This dashboard watches your
            chargeback exposure, dispute patterns, and compliance status around the clock so you can
            fix problems before revenue stalls.
          </p>

          <div className="grid gap-3 text-sm text-[#d0d7de] sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-lg border border-[#223142] bg-[#111827]/80 p-3">
              <BellRing className="mt-0.5 h-4 w-4 text-[#23c29a]" />
              Real-time alerts when risk exceeds your threshold
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#223142] bg-[#111827]/80 p-3">
              <TrendingDown className="mt-0.5 h-4 w-4 text-[#4fb8ff]" />
              Trendline shows if mitigation efforts are working
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#223142] bg-[#111827]/80 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[#23c29a]" />
              Compliance watch on verification and payout flags
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#223142] bg-[#111827]/80 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-[#f7b955]" />
              30-minute monitoring cycles plus webhook-triggered checks
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>Buy Access for $15/month</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">View Dashboard Preview</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#ff8b9a]">Problem</CardTitle>
            <CardDescription>Founders find out too late</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[#c2c9d2]">
            Most teams discover Stripe risk only after payment freezes, reserves, or sudden verification
            escalations already hurt cash flow.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#4fb8ff]">Solution</CardTitle>
            <CardDescription>Predictive account health scoring</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[#c2c9d2]">
            Continuous monitoring converts raw Stripe metrics into a clear risk score and concise action
            notes you can execute immediately.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#23c29a]">Outcome</CardTitle>
            <CardDescription>Defend revenue continuity</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[#c2c9d2]">
            Early warning lets you tighten policies, update verification, and lower dispute pressure before
            Stripe interventions impact operations.
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 rounded-2xl border border-[#243244] bg-[#0f172a]/75 p-6 sm:p-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold">Pricing</h2>
          <p className="mt-2 text-sm text-[#9aa4b2]">
            Built for teams where payment downtime means immediate revenue loss.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-3xl font-semibold">
              <BadgeDollarSign className="h-7 w-7 text-[#23c29a]" />
              $15<span className="text-base font-normal text-[#9aa4b2]">/month</span>
            </p>
            <ul className="space-y-1 text-sm text-[#c4ccd6]">
              {["Unlimited monitoring checks", "Email + SMS alerts", "Webhook + scheduled tracking", "Risk trend dashboard"].map(
                (item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-[#23c29a]" /> {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild size="lg">
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>Subscribe with Stripe</a>
            </Button>
            <p className="max-w-xs text-xs text-[#7d8590]">
              Use your Payment Link success redirect: <code className="mono">/api/stripe/connect?session_id=&#123;CHECKOUT_SESSION_ID&#125;</code>
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="grid gap-3">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle className="text-base">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[#c4ccd6]">{faq.answer}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
