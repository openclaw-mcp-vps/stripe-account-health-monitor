import { NextResponse } from "next/server";
import { z } from "zod";

import { createAccessCookieValue, getAccessCookieName } from "@/lib/access-cookie";
import { hasActiveAccess } from "@/lib/database";

const UnlockSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = UnlockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Please enter a valid billing email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const accessGranted = await hasActiveAccess(email);

  if (!accessGranted) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No active purchase was found for this email yet. If you just checked out, wait a minute for webhook sync and retry.",
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ ok: true, message: "Access granted. Redirecting to your dashboard..." });
  response.cookies.set({
    name: getAccessCookieName(),
    value: createAccessCookieValue(email),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
