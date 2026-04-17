import Stripe from "stripe";

export interface StripeAccountSnapshot {
  accountId: string;
  accountEmail: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentlyDueCount: number;
  pastDueCount: number;
  eventuallyDueCount: number;
  disabledReason: string | null;
  balanceAvailable: number;
  balancePending: number;
  country: string | null;
  defaultCurrency: string | null;
  lastRefreshedAt: string;
}

let stripeClient: Stripe | null = null;

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }

  return stripeClient;
}

export async function getStripeAccountSnapshot(): Promise<StripeAccountSnapshot> {
  const stripe = getStripeClient();

  if (!stripe) {
    return {
      accountId: "acct_demo",
      accountEmail: null,
      chargesEnabled: true,
      payoutsEnabled: true,
      currentlyDueCount: 0,
      pastDueCount: 0,
      eventuallyDueCount: 2,
      disabledReason: null,
      balanceAvailable: 124500,
      balancePending: 38400,
      country: "US",
      defaultCurrency: "usd",
      lastRefreshedAt: new Date().toISOString(),
    };
  }

  const account = await stripe.accounts.retrieve();
  const balance = await stripe.balance.retrieve();

  const available = balance.available.reduce((sum, item) => sum + item.amount, 0);
  const pending = balance.pending.reduce((sum, item) => sum + item.amount, 0);

  return {
    accountId: account.id,
    accountEmail: account.email ?? null,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    currentlyDueCount: account.requirements?.currently_due?.length ?? 0,
    pastDueCount: account.requirements?.past_due?.length ?? 0,
    eventuallyDueCount: account.requirements?.eventually_due?.length ?? 0,
    disabledReason: account.requirements?.disabled_reason ?? null,
    balanceAvailable: available,
    balancePending: pending,
    country: account.country ?? null,
    defaultCurrency: account.default_currency ?? null,
    lastRefreshedAt: new Date().toISOString(),
  };
}
