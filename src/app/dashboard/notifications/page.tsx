"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { UserAlert } from "@/lib/planning";
import { EmptyNotice, PageHero, SurfacePanel } from "@/components/dashboard-surface";

const badgeStyles = {
  Info: "bg-cyan-400/12 text-cyan-100",
  Watch: "bg-amber-400/12 text-amber-100",
  Action: "bg-rose-400/12 text-rose-100",
} as const;

const supabase = createClient();

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      const { data, error } = await supabase.from("user_alerts").select("*").order("is_read", { ascending: true }).order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setAlerts((data as UserAlert[]) ?? []);
    }
    void loadAlerts();
  }, []);

  async function markReviewed(id: string) {
    const { error } = await supabase.from("user_alerts").update({ is_read: true }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setAlerts((current) => current.map((alert) => (alert.id === id ? { ...alert, is_read: true } : alert)));
  }

  return (
    <section className="space-y-6">
      <PageHero eyebrow="Alerts" title="Surface important portfolio reminders" description="Unread and reviewed alerts now sit in a purpose-built WealthWise feed instead of generic cards." />
      {error ? <EmptyNotice message={error} tone="error" /> : null}
      <SurfacePanel title="Action queue" subtitle="Goal gaps, investment reminders, and portfolio prompts appear here in time order.">
        <div className="space-y-4">
          {alerts.length === 0 ? <EmptyNotice message="No alerts yet. New investments and goals will generate reminders here." /> : null}
          {alerts.map((alert) => (
            <article key={alert.id} className={`rounded-[28px] border border-white/8 bg-[#071510] p-6 ${alert.is_read ? "opacity-65" : ""}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[alert.severity]}`}>{alert.severity}</span>
                    <span className="text-sm text-white/45">{formatDate(alert.created_at)}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">{alert.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">{alert.description}</p>
                </div>
                <button onClick={() => void markReviewed(alert.id)} disabled={alert.is_read} className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/88 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-55">{alert.is_read ? "Reviewed" : "Mark reviewed"}</button>
              </div>
            </article>
          ))}
        </div>
      </SurfacePanel>
    </section>
  );
}
