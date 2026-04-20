"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BellRing, Loader2 } from "lucide-react";
import { AlertSettings as AlertSettingsType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  emailTo: z.string().email("Enter a valid email address."),
  phoneTo: z.string().min(7, "Use international format, for example +14155550123.").or(z.literal("")),
  riskThreshold: z.coerce.number().min(10).max(100),
  cooldownMinutes: z.coerce.number().min(15).max(1440),
  sendDailyDigest: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AlertSettingsProps {
  initialSettings: AlertSettingsType;
  deliveryReadiness: {
    smtpReady: boolean;
    twilioReady: boolean;
  };
  onSaved: (settings: AlertSettingsType) => void;
}

export function AlertSettings({ initialSettings, deliveryReadiness, onSaved }: AlertSettingsProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialSettings,
  });

  const emailEnabled = watch("emailEnabled");
  const smsEnabled = watch("smsEnabled");

  async function onSubmit(values: FormValues) {
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as {
        error?: string;
        settings?: AlertSettingsType;
      };

      if (!response.ok || !payload.settings) {
        throw new Error(payload.error || "Could not save alert settings.");
      }

      onSaved(payload.settings);
      setSaveSuccess("Alert settings saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save alert settings.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-[#4fb8ff]" /> Alert Settings
        </CardTitle>
        <CardDescription>
          Define when to alert and where to send notifications. Alerts fire only when risk rises above
          your threshold.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-[#243244] p-3">
                <Label htmlFor="emailEnabled">Email Alerts</Label>
                <Switch
                  id="emailEnabled"
                  checked={emailEnabled}
                  onCheckedChange={(checked) => setValue("emailEnabled", checked)}
                />
              </div>
              <Input
                type="email"
                placeholder="ops@company.com"
                {...register("emailTo")}
                disabled={!emailEnabled}
              />
              {errors.emailTo ? <p className="text-xs text-[#ff8b9a]">{errors.emailTo.message}</p> : null}
              {!deliveryReadiness.smtpReady ? (
                <p className="text-xs text-[#f7b955]">SMTP credentials missing. Email delivery is offline.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-[#243244] p-3">
                <Label htmlFor="smsEnabled">SMS Alerts</Label>
                <Switch
                  id="smsEnabled"
                  checked={smsEnabled}
                  onCheckedChange={(checked) => setValue("smsEnabled", checked)}
                />
              </div>
              <Input
                type="text"
                placeholder="+14155550123"
                {...register("phoneTo")}
                disabled={!smsEnabled}
              />
              {errors.phoneTo ? <p className="text-xs text-[#ff8b9a]">{errors.phoneTo.message}</p> : null}
              {!deliveryReadiness.twilioReady ? (
                <p className="text-xs text-[#f7b955]">Twilio credentials missing. SMS delivery is offline.</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="riskThreshold">Risk Threshold (0-100)</Label>
              <Input id="riskThreshold" type="number" min={10} max={100} {...register("riskThreshold")} />
              {errors.riskThreshold ? (
                <p className="text-xs text-[#ff8b9a]">{errors.riskThreshold.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cooldownMinutes">Cooldown Minutes</Label>
              <Input
                id="cooldownMinutes"
                type="number"
                min={15}
                max={1440}
                {...register("cooldownMinutes")}
              />
              {errors.cooldownMinutes ? (
                <p className="text-xs text-[#ff8b9a]">{errors.cooldownMinutes.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#243244] p-3">
            <div>
              <Label htmlFor="sendDailyDigest">Daily Digest</Label>
              <p className="text-xs text-[#7d8590]">Send a once-daily summary even if risk stays stable.</p>
            </div>
            <Switch
              id="sendDailyDigest"
              checked={watch("sendDailyDigest")}
              onCheckedChange={(checked) => setValue("sendDailyDigest", checked)}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving
              </>
            ) : (
              "Save Alert Settings"
            )}
          </Button>

          {saveError ? <p className="text-sm text-[#ff8b9a]">{saveError}</p> : null}
          {saveSuccess ? <p className="text-sm text-[#a7f3d0]">{saveSuccess}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
