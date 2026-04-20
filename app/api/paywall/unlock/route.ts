import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isPaidCustomer } from "@/lib/database";
import { createPaywallToken, PAYWALL_COOKIE_NAME } from "@/lib/paywall";

export const runtime = "nodejs";

const unlockSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") || "";

  let email: string;
  let isFormRequest = false;

  if (contentType.includes("application/json")) {
    const parsed = unlockSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid purchase email is required" }, { status: 400 });
    }
    email = parsed.data.email;
  } else {
    const formData = await request.formData();
    const parsed = unlockSchema.safeParse({
      email: formData.get("email")
    });

    if (!parsed.success) {
      return NextResponse.redirect(new URL("/thank-you?error=invalid-email", request.url));
    }

    isFormRequest = true;
    email = parsed.data.email;
  }

  if (!isPaidCustomer(email)) {
    if (isFormRequest) {
      return NextResponse.redirect(new URL("/thank-you?error=purchase-not-found", request.url));
    }

    return NextResponse.json(
      {
        error:
          "No active purchase found for this email yet. If you paid moments ago, wait for webhook processing and retry."
      },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: PAYWALL_COOKIE_NAME,
    value: createPaywallToken(email),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });

  if (isFormRequest) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.json({ success: true });
}
