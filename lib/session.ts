import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const USER_COOKIE = "sahm_uid";
export const PAID_COOKIE = "sahm_paid";

export function resolveUserId(request: NextRequest) {
  const fromCookie = request.cookies.get(USER_COOKIE)?.value;
  if (fromCookie) {
    return { userId: fromCookie, isNew: false };
  }

  return { userId: randomUUID(), isNew: true };
}

export function applySessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(USER_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function applyPaidCookie(response: NextResponse) {
  response.cookies.set(PAID_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearPaidCookie(response: NextResponse) {
  response.cookies.set(PAID_COOKIE, "0", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function hasPaidCookie(request: NextRequest) {
  return request.cookies.get(PAID_COOKIE)?.value === "1";
}
