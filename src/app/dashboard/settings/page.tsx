"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { NotificationPreferences } from "@/lib/planning";
import { AccentButton, EmptyNotice, PageHero, SurfacePanel } from "@/components/dashboard-surface";

const defaultPrefs: Omit<NotificationPreferences, "user_id" | "updated_at"> = {
  sip_due_in_app: true,
  sip_due_email: false,
  goal_milestones_in_app: true,
  goal_milestones_email: false,
  daily_digest_email: false,
  market_alerts_in_app: true,
};

export default function SettingsPage() {
  const supabase = createClient();
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrefs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setPrefs({
          sip_due_in_app: data.sip_due_in_app,
          sip_due_email: data.sip_due_email,
          goal_milestones_in_app: data.goal_milestones_in_app,
          goal_milestones_email: data.goal_milestones_email,
          daily_digest_email: data.daily_digest_email,
          market_alerts_in_app: data.market_alerts_in_app,
        });
      }
    }
    void loadPrefs();
  }, [supabase]);

  async function savePrefs() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("notification_preferences").upsert({ user_id: user.id, ...prefs });
    setMessage(error ? error.message : "Notification preferences saved.");
  }

  return (
    <section className="space-y-6">
      <PageHero eyebrow="Settings" title="Notification preferences" description="Choose how WealthWise reaches you for SIP reminders, goal milestones, and market signals." />
      <SurfacePanel title="Delivery channels" subtitle="These toggles are now presented in the same premium visual language as the rest of the product.">
        <div className="space-y-4">
          {Object.entries(prefs).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between rounded-[22px] border border-white/8 bg-[#071510] px-4 py-4 text-sm text-white/78">
              <span>{key.replaceAll("_", " ")}</span>
              <input type="checkbox" checked={value} onChange={(event) => setPrefs((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-[#b4ff45]" />
            </label>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <AccentButton onClick={savePrefs}>Save settings</AccentButton>
          {message ? <EmptyNotice message={message} tone="success" /> : null}
        </div>
      </SurfacePanel>
    </section>
  );
}
