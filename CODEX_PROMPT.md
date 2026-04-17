# Build Task: stripe-account-health-monitor

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: stripe-account-health-monitor
HEADLINE: Monitor Stripe account for sudden deactivation risks
WHAT: None
WHY: None
WHO PAYS: None
NICHE: business-tools
PRICE: $$15/mo

ARCHITECTURE SPEC:
A Next.js dashboard that connects to Stripe's API to monitor account health metrics, compliance status, and risk indicators. Uses webhooks to track real-time changes and sends alerts when potential deactivation risks are detected.

PLANNED FILES:
- app/page.tsx
- app/dashboard/page.tsx
- app/api/stripe/connect/route.ts
- app/api/stripe/webhook/route.ts
- app/api/health-check/route.ts
- app/api/lemonsqueezy/webhook/route.ts
- components/HealthScore.tsx
- components/RiskAlerts.tsx
- components/MetricsDashboard.tsx
- lib/stripe-client.ts
- lib/health-analyzer.ts
- lib/alert-system.ts
- lib/database.ts

DEPENDENCIES: next, react, typescript, tailwindcss, stripe, @lemonsqueezy/lemonsqueezy.js, prisma, @prisma/client, resend, zod, lucide-react

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
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
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.


PREVIOUS ATTEMPT FAILED WITH:
Codex timed out after 600s
Please fix the above errors and regenerate.