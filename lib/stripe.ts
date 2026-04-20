import Stripe from "stripe";

const APP_INFO = {
  name: "Stripe Account Health Monitor",
  version: "1.0.0",
};

function createClient(secretKey: string) {
  return new Stripe(secretKey, {
    appInfo: APP_INFO,
  });
}

export interface StripeRiskMetrics {
  accountId: string;
  accountLabel: string;
  successfulChargesLast30Days: number;
  disputesLast30Days: number;
  disputeVelocity7d: number;
  chargebackRate: number;
  refundRate30d: number;
  failedPaymentRate7d: number;
  complianceFlags: string[];
  notes: string[];
}

export async function validateStripeSecretKey(secretKey: string) {
  const client = createClient(secretKey);
  const account = await client.accounts.retrieve();

  return {
    id: account.id,
    displayName:
      account.settings?.dashboard?.display_name ||
      account.business_profile?.name ||
      account.email ||
      account.id,
  };
}

export async function collectStripeMetrics(secretKey: string): Promise<StripeRiskMetrics> {
  const stripe = createClient(secretKey);
  const now = Math.floor(Date.now() / 1000);
  const days30 = now - 60 * 60 * 24 * 30;
  const days7 = now - 60 * 60 * 24 * 7;

  const [account, disputes30d, disputes7d, charges30d, intents7d] = await Promise.all([
    stripe.accounts.retrieve(),
    stripe.disputes.list({ created: { gte: days30 }, limit: 100 }),
    stripe.disputes.list({ created: { gte: days7 }, limit: 100 }),
    stripe.charges.list({ created: { gte: days30 }, limit: 100 }),
    stripe.paymentIntents.list({ created: { gte: days7 }, limit: 100 }),
  ]);

  const successfulCharges = charges30d.data.filter((charge) => charge.paid && charge.status === "succeeded");
  const refundedCharges = successfulCharges.filter((charge) => charge.refunded || charge.amount_refunded > 0);

  const failedIntents = intents7d.data.filter(
    (intent) => intent.status === "canceled" || intent.status === "requires_payment_method",
  );

  const successfulChargeCount = successfulCharges.length;
  const disputesCount30d = disputes30d.data.length;
  const chargebackRate = successfulChargeCount > 0 ? disputesCount30d / successfulChargeCount : 0;
  const refundRate = successfulChargeCount > 0 ? refundedCharges.length / successfulChargeCount : 0;
  const failedPaymentRate = intents7d.data.length > 0 ? failedIntents.length / intents7d.data.length : 0;

  const complianceFlags: string[] = [];
  const notes: string[] = [];

  if (account.charges_enabled === false) {
    complianceFlags.push("charges_disabled");
    notes.push("Stripe has disabled charges on the connected account.");
  }

  if (account.payouts_enabled === false) {
    complianceFlags.push("payouts_disabled");
    notes.push("Payouts are currently disabled. This can precede account restrictions.");
  }

  if ((account.requirements?.currently_due?.length ?? 0) > 0) {
    complianceFlags.push("verification_fields_due");
    notes.push(
      `Stripe still requires ${account.requirements?.currently_due?.length ?? 0} verification field(s).`,
    );
  }

  if ((account.requirements?.past_due?.length ?? 0) > 0) {
    complianceFlags.push("verification_past_due");
    notes.push(
      `There are ${account.requirements?.past_due?.length ?? 0} past-due verification requirement(s).`,
    );
  }

  if (chargebackRate >= 0.009) {
    notes.push("Chargeback rate is in a range where Stripe may apply reserves or restrictions.");
  }

  if (refundRate >= 0.12) {
    notes.push("Refund rate is elevated and can trigger risk-team review.");
  }

  if (failedPaymentRate >= 0.12) {
    notes.push("Failed payment attempts are unusually high over the last 7 days.");
  }

  return {
    accountId: account.id,
    accountLabel:
      account.settings?.dashboard?.display_name ||
      account.business_profile?.name ||
      account.email ||
      account.id,
    successfulChargesLast30Days: successfulChargeCount,
    disputesLast30Days: disputesCount30d,
    disputeVelocity7d: disputes7d.data.length,
    chargebackRate,
    refundRate30d: refundRate,
    failedPaymentRate7d: failedPaymentRate,
    complianceFlags,
    notes,
  };
}

function getPlatformStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required for purchase verification and webhook handling.");
  }

  return createClient(secretKey);
}

export async function verifyCheckoutSessionPaid(sessionId: string) {
  const stripe = getPlatformStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return null;
  }

  return {
    id: session.id,
    customerEmail: session.customer_details?.email || undefined,
    amountTotal: session.amount_total ?? undefined,
    currency: session.currency ?? undefined,
  };
}

export function getWebhookStripe() {
  return getPlatformStripeClient();
}
