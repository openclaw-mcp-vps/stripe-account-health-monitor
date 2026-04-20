import Link from "next/link";
import { cookies } from "next/headers";
import { Lock, ShieldAlert } from "lucide-react";
import { DashboardClient } from "@/components/DashboardClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/db";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("sahm_uid")?.value;
  const paidCookie = cookieStore.get("sahm_paid")?.value === "1";

  let accountName = "";
  let paidFromStore = false;

  if (userId) {
    const user = await getUser(userId);
    paidFromStore = user.paid;
    accountName = user.stripeDisplayName || "";
  }

  const hasAccess = paidCookie || paidFromStore;

  if (!hasAccess) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-12 sm:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="h-5 w-5 text-[#f7b955]" /> Dashboard Access Locked
            </CardTitle>
            <CardDescription>
              Purchase access and return through Stripe success redirect to unlock cookie-based dashboard
              access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[#253446] bg-[#0f172a] p-4 text-sm text-[#c2c9d2]">
              Configure your Stripe Payment Link success redirect to:
              <p className="mt-2 rounded bg-[#0b1220] px-2 py-1 mono text-xs text-[#9fb3c8]">
                /api/stripe/connect?session_id=&#123;CHECKOUT_SESSION_ID&#125;
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>Buy Dashboard Access</a>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/">Back to Overview</Link>
              </Button>
            </div>
            <p className="flex items-center gap-2 text-xs text-[#7d8590]">
              <ShieldAlert className="h-4 w-4" />
              After verification, this route is protected by secure HTTP-only cookies.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      <DashboardClient initialConnectedAccount={accountName} />
    </main>
  );
}
