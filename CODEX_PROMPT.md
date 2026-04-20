# Build Task: stripe-account-health-monitor

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: stripe-account-health-monitor
HEADLINE: Monitor Stripe account for sudden deactivation risks
WHAT: Monitors your Stripe account health 24/7 and alerts you before potential deactivations. Tracks key metrics like chargeback rates, dispute patterns, and compliance flags that could trigger account suspension.
WHY: Stripe can freeze accounts with little warning, killing revenue overnight. Most founders only discover issues after it's too late. Early detection gives you time to fix problems before losing payment processing.
WHO PAYS: SaaS founders and e-commerce operators processing $10K+ monthly through Stripe. Especially those in higher-risk verticals or with thin margins who can't afford payment disruptions.
NICHE: business-tools
PRICE: $$15/mo

ARCHITECTURE SPEC:
A Next.js dashboard that connects to Stripe's API to continuously monitor account health metrics like chargeback rates, dispute patterns, and compliance flags. Uses webhooks and scheduled jobs to track changes and send email/SMS alerts when thresholds are exceeded that could indicate deactivation risk.

PLANNED FILES:
- app/page.tsx
- app/dashboard/page.tsx
- app/api/stripe/connect/route.ts
- app/api/stripe/webhook/route.ts
- app/api/monitor/route.ts
- app/api/alerts/route.ts
- components/MetricsCard.tsx
- components/AlertSettings.tsx
- components/StripeConnect.tsx
- lib/stripe.ts
- lib/monitoring.ts
- lib/alerts.ts
- lib/db.ts
- prisma/schema.prisma

DEPENDENCIES: next, react, typescript, tailwindcss, stripe, prisma, @prisma/client, nodemailer, twilio, @lemonsqueezy/lemonsqueezy.js, recharts, lucide-react, next-auth, node-cron

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Stripe Payment Link for payments (hosted checkout — use the URL directly as the Buy button href)
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}
- NO HEAVY ORMs: Do NOT use Prisma, Drizzle, TypeORM, Sequelize, or Mongoose. If the tool needs persistence, use direct SQL via `pg` (Postgres) or `better-sqlite3` (local), or just filesystem JSON. Reason: these ORMs require schema files and codegen steps that fail on Vercel when misconfigured.
- INTERNAL FILE DISCIPLINE: Every internal import (paths starting with `@/`, `./`, or `../`) MUST refer to a file you actually create in this build. If you write `import { Card } from "@/components/ui/card"`, then `components/ui/card.tsx` MUST exist with a real `export const Card` (or `export default Card`). Before finishing, scan all internal imports and verify every target file exists. Do NOT use shadcn/ui patterns unless you create every component from scratch — easier path: write all UI inline in the page that uses it.
- DEPENDENCY DISCIPLINE: Every package imported in any .ts, .tsx, .js, or .jsx file MUST be
  listed in package.json dependencies (or devDependencies for build-only). Before finishing,
  scan all source files for `import` statements and verify every external package (anything
  not starting with `.` or `@/`) appears in package.json. Common shadcn/ui peers that MUST
  be added if used:
  - lucide-react, clsx, tailwind-merge, class-variance-authority
  - react-hook-form, zod, @hookform/resolvers
  - @radix-ui/* (for any shadcn component)
- After running `npm run build`, if you see "Module not found: Can't resolve 'X'", add 'X'
  to package.json dependencies and re-run npm install + npm run build until it passes.

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_STRIPE_PAYMENT_LINK  (full URL, e.g. https://buy.stripe.com/test_XXX)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (pk_test_... or pk_live_...)
- STRIPE_WEBHOOK_SECRET  (set when webhook is wired)

BUY BUTTON RULE: the Buy button's href MUST be `process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
used as-is — do NOT construct URLs from a product ID, do NOT prepend any base URL,
do NOT wrap it in an embed iframe. The link opens Stripe's hosted checkout directly.

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.
