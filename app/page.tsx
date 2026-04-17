import Link from "next/link";
import Script from "next/script";
import { ArrowRight, BadgeAlert, CheckCircle2, ShieldCheck } from "lucide-react";

import { AccessGateForm } from "@/components/AccessGateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    q: "How does this reduce deactivation risk?",
    a: "It monitors Stripe account capability changes, due requirements, disabled reasons, and webhook-triggered account events, then highlights exactly what to fix first.",
  },
  {
    q: "Do I need engineering support to use it?",
    a: "No. Connect Stripe once, and operations teams can use the dashboard immediately. Alerts and recommendations are written in plain language.",
  },
  {
    q: "What happens after checkout?",
    a: "Checkout opens in a Lemon Squeezy overlay. After payment, enter your billing email in the unlock form and you get instant cookie-based access.",
  },
  {
    q: "Will this work with test mode?",
    a: "Yes. You can validate your monitoring setup in Stripe test mode before connecting production credentials.",
  },
];

export default function HomePage() {
  const lemonProductId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  const checkoutUrl = lemonProductId
    ? `https://app.lemonsqueezy.com/checkout/buy/${lemonProductId}`
    : "#pricing";

  return (
    <main className="min-h-screen bg-transparent text-slate-100">
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Stripe Account Health Monitor
        </div>
        <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">
          Dashboard
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-3 inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-wider text-emerald-300">
            Protect recurring revenue
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Monitor Stripe account for sudden deactivation risks
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
            Catch compliance blockers, disabled capabilities, and risk indicators before they interrupt payments.
            Your team gets a live health score, clear recommendations, and event-driven alerts.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={checkoutUrl} className="lemonsqueezy-button">
              <Button className="w-full sm:w-auto">Start monitoring for $15/mo</Button>
            </a>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">
                View dashboard preview
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-400">Cancel anytime. Setup takes less than ten minutes.</p>
        </div>

        <Card className="border-emerald-500/30 bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-xl">Why teams lose Stripe access unexpectedly</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <p className="flex items-start gap-2">
              <BadgeAlert className="mt-0.5 h-4 w-4 text-amber-400" />
              Requirements move from "eventually due" to "past due" fast, and nobody notices until payouts freeze.
            </p>
            <p className="flex items-start gap-2">
              <BadgeAlert className="mt-0.5 h-4 w-4 text-amber-400" />
              Policy and capability updates happen through webhooks, but most teams never route those signals to ops.
            </p>
            <p className="flex items-start gap-2">
              <BadgeAlert className="mt-0.5 h-4 w-4 text-amber-400" />
              Revenue teams only discover risk after support tickets and failed payment attempts start piling up.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-semibold text-white">What you get</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Live health score",
              copy: "A single score translates Stripe account complexity into an immediate risk signal.",
            },
            {
              title: "Action-first alerts",
              copy: "Each detected issue includes exactly what to resolve and why it matters for deactivation prevention.",
            },
            {
              title: "Webhook event tracking",
              copy: "Account changes are logged in real time so your team can react before payment flow is interrupted.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">{item.copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-10">
        <Card className="border-emerald-500/30 bg-slate-900/90">
          <CardContent className="grid gap-8 p-6 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm text-emerald-300">Simple pricing</p>
              <h3 className="mt-2 text-3xl font-semibold text-white">$15/month</h3>
              <p className="mt-2 text-slate-300">Continuous Stripe risk monitoring for one account, with webhook-based updates and alerts.</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {[
                  "Account health scoring and trend view",
                  "Compliance requirement monitoring",
                  "Real-time webhook ingestion",
                  "Priority risk recommendations",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a href={checkoutUrl} className="lemonsqueezy-button mt-6 inline-block">
                <Button>
                  Buy access <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
            <AccessGateForm />
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <h3 className="text-2xl font-semibold text-white">FAQ</h3>
        <div className="mt-4 space-y-3">
          {faqs.map((item) => (
            <Card key={item.q}>
              <CardHeader>
                <CardTitle className="text-base">{item.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
