import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ThankYouPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-12 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Unlock your dashboard access</CardTitle>
            <CardDescription>
              After checkout, Lemon Squeezy sends us your purchase email through webhook. Enter that same
              email to issue your signed access cookie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/paywall/unlock" method="POST" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Purchase email</Label>
                <Input id="email" type="email" name="email" required placeholder="founder@company.com" />
              </div>
              <Button type="submit">Unlock Dashboard</Button>
            </form>

            <p className="mt-6 text-sm text-zinc-400">
              If unlock fails right after payment, wait a few seconds and try again while the webhook event is
              still processing.
            </p>

            <div className="mt-6">
              <Link href="/">
                <Button variant="ghost">Back to landing page</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
