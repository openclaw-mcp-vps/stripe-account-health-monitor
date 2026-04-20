# Stripe Account Health Monitor

A Next.js 15 App Router application for monitoring Stripe account deactivation risk through dispute, chargeback, payout, and compliance signals.

## Features

- Conversion-focused landing page with Lemon Squeezy checkout overlay
- Cookie-based paid access gate for `/dashboard`
- Stripe account connection via restricted secret key
- Health score engine with risk reasons + recommended actions
- 7-day disputes/refunds trend chart (`recharts`)
- Configurable threshold alerts (email + SMS)
- Stripe webhook ingestion for event-triggered re-checks
- Lemon Squeezy webhook ingestion for purchase verification
- `/api/health` uptime endpoint

## Environment

Copy `.env.example` to `.env.local` and set values.

Important:

- Configure Lemon Squeezy webhook to `POST /api/lemonsqueezy/webhook`
- Configure Stripe webhook to `POST /api/stripe/webhook`
- For scheduled checks in serverless, hit `POST /api/monitor` from an external cron provider and pass `x-monitor-token` = `MONITOR_CRON_SECRET`

## Run

```bash
npm install
npm run build
npm run dev
```
