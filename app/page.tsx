import Link from "next/link";
import { cookies } from "next/headers";
import { AlertTriangle, BellRing, ShieldAlert, Zap } from "lucide-react";
import { PricingCheckout } from "@/components/PricingCheckout";

const faqItems = [
  {
    question: "How does this reduce Stripe deactivation risk?",
    answer:
      "It tracks the exact indicators Stripe uses to assess account quality: dispute intensity, chargeback rate, payout health, and unresolved compliance requirements. When your risk trend shifts, you get alerted before account restrictions escalate.",
  },
  {
    question: "Will this work for both SaaS and e-commerce?",
    answer:
      "Yes. If your Stripe account processes at least $10K/month and you depend on uninterrupted card acceptance, the monitor surfaces useful early warning signals and gives remediation guidance.",
  },
  {
    question: "How fast are alerts delivered?",
    answer:
      "Critical and high-risk runs trigger immediate alert dispatch through configured email and SMS channels, and webhook-triggered checks can run within seconds of dispute or compliance events.",
  },
  {
    question: "Do I need full write access Stripe keys?",
    answer:
      "No. Use a restricted key with read access to charges, disputes, payouts, and account details. Monitoring works without transaction mutation permissions.",
  },
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isPaid = cookieStore.get("shm_paid")?.value === "1";

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <nav className="flex items-center justify-between rounded-xl border border-[#2f3b4a] bg-[#161b22]/80 px-4 py-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#58a6ff]">Business Tools</p>
            <p className="text-sm font-semibold text-[#e6edf3]">Stripe Account Health Monitor</p>
          </div>
          <Link
            href={isPaid ? "/dashboard" : "#pricing"}
            className="rounded-md border border-[#2f3b4a] px-3 py-1.5 text-sm text-[#c9d1d9] transition hover:bg-[#21262d]"
          >
            {isPaid ? "Open Dashboard" : "Get Access"}
          </Link>
        </nav>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#1f6feb]/40 bg-[#1f6feb]/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-[#58a6ff]">
              <ShieldAlert className="h-3.5 w-3.5" />
              Prevent sudden Stripe freezes
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
              Monitor Stripe account health 24/7 and fix risk signals before deactivation.
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-[#8b949e]">
              Stripe can pause payouts or freeze processing with little warning. This monitor watches chargeback rate,
              dispute patterns, payout failures, and compliance flags so you can act early and keep revenue flowing.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#2f3b4a] bg-[#161b22]/70 p-4">
                <p className="text-3xl font-semibold text-[#3fb950]">0.75%</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#8b949e]">Default chargeback alert line</p>
              </div>
              <div className="rounded-xl border border-[#2f3b4a] bg-[#161b22]/70 p-4">
                <p className="text-3xl font-semibold text-[#58a6ff]">15 min</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#8b949e]">Scheduled monitoring cadence</p>
              </div>
              <div className="rounded-xl border border-[#2f3b4a] bg-[#161b22]/70 p-4">
                <p className="text-3xl font-semibold text-[#d29922]">2 channels</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#8b949e]">Email + SMS escalation</p>
              </div>
            </div>
          </div>

          <div id="pricing">
            <PricingCheckout alreadyPaid={isPaid} highlighted />
          </div>
        </div>
      </section>

      <section className="border-y border-[#2f3b4a] bg-[#0d1117]/70">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-3 md:px-8">
          <article className="rounded-xl border border-[#2f3b4a] bg-[#161b22]/75 p-5">
            <AlertTriangle className="h-5 w-5 text-[#f85149]" />
            <h2 className="mt-3 text-xl font-semibold">Problem</h2>
            <p className="mt-2 text-sm text-[#8b949e]">
              Most founders discover Stripe account deterioration only after payouts fail or payment processing is
              restricted, when remediation options are limited and cash flow is already damaged.
            </p>
          </article>

          <article className="rounded-xl border border-[#2f3b4a] bg-[#161b22]/75 p-5">
            <Zap className="h-5 w-5 text-[#58a6ff]" />
            <h2 className="mt-3 text-xl font-semibold">Solution</h2>
            <p className="mt-2 text-sm text-[#8b949e]">
              Automated Stripe health checks quantify risk and detect trend changes fast. You receive clear reasons,
              severity, and tactical recommendations before risk becomes an account shutdown event.
            </p>
          </article>

          <article className="rounded-xl border border-[#2f3b4a] bg-[#161b22]/75 p-5">
            <BellRing className="h-5 w-5 text-[#3fb950]" />
            <h2 className="mt-3 text-xl font-semibold">Who Pays</h2>
            <p className="mt-2 text-sm text-[#8b949e]">
              SaaS founders and e-commerce operators processing $10K+ per month, especially thin-margin businesses in
              higher-risk categories that cannot absorb an unexpected payment disruption.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <h2 className="text-3xl font-semibold">Frequently Asked Questions</h2>
        <div className="mt-6 grid gap-4">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border border-[#2f3b4a] bg-[#161b22]/75 p-5">
              <h3 className="text-lg font-medium">{item.question}</h3>
              <p className="mt-2 text-sm text-[#8b949e]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
