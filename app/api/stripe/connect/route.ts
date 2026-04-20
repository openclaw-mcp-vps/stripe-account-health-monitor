import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { getStripeAccount, upsertStripeAccount } from "@/lib/database";

export const runtime = "nodejs";

const connectSchema = z.object({
  accountId: z.string().min(2),
  operatorEmail: z.string().email().nullable().optional()
});

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(secretKey);
}

export async function GET(): Promise<NextResponse> {
  const account = getStripeAccount();
  return NextResponse.json({ account });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = connectSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid account connection payload" }, { status: 400 });
    }

    const stripe = getStripeClient();
    const requestedAccount = parsed.data.accountId.trim();

    const stripeAccount =
      requestedAccount === "self"
        ? await stripe.accounts.retrieveCurrent()
        : await stripe.accounts.retrieve(requestedAccount);

    upsertStripeAccount(stripeAccount.id, parsed.data.operatorEmail ?? null);

    return NextResponse.json({
      message: `Connected Stripe account ${stripeAccount.id}`,
      account: {
        id: stripeAccount.id,
        email: stripeAccount.email,
        country: stripeAccount.country
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message || "Failed to connect Stripe account"
      },
      { status: 500 }
    );
  }
}
