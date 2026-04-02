"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { InvestmentPlan } from "@/lib/planning";
import { DataPill, EmptyNotice, MetricTile, PageHero, SurfacePanel } from "@/components/dashboard-surface";

const supabase = createClient();

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadInvestments() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("Please sign in again to load investments.");
      return;
    }

    const { data, error } = await supabase.from("investment_plans").select("*").eq("is_deleted", false).order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setInvestments((data as InvestmentPlan[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { queueMicrotask(() => { void loadInvestments(); }); }, []);

  async function togglePause(item: InvestmentPlan) {
    await supabase.from("investment_plans").update({ is_paused: !item.is_paused }).eq("id", item.id);
    void loadInvestments();
  }

  async function deleteInvestment(id: string) {
    await supabase.from("investment_plans").update({ is_deleted: true }).eq("id", id);
    void loadInvestments();
  }

  const monthlySip = investments.filter((item) => item.investment_mode === "SIP" && !item.is_paused).reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="space-y-6">
      <PageHero eyebrow="Investments" title="Manage active SIPs and planned contributions" description="Every plan is now surfaced in the same WealthWise visual system, with goal links, pause controls, and bulk import access." action={<div className="flex flex-wrap gap-3"><Link href="/dashboard/investments/import" className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/8">Import CSV</Link><Link href="/dashboard/investments/new" className="rounded-full bg-[#b4ff45] px-5 py-3 text-sm font-semibold text-[#062415] transition hover:bg-[#c6ff74]">Add investment</Link></div>} />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Active plans" value={String(investments.length)} note="Saved investment plans in this account" />
        <MetricTile label="Monthly SIP outflow" value={formatCompactCurrency(monthlySip)} note="Recurring commitment currently active" />
        <MetricTile label="Largest order" value={formatCompactCurrency(investments.length > 0 ? Math.max(...investments.map((item) => item.amount)) : 0)} note="Highest single planned contribution" />
      </div>

      <SurfacePanel title="Saved investments" subtitle="These rows are loaded from Supabase for the signed-in user and styled to match the rest of the app.">
        {loading ? <EmptyNotice message="Loading investments..." /> : null}
        {error ? <EmptyNotice message={error} tone="error" /> : null}
        {!loading && !error && investments.length === 0 ? <EmptyNotice message="No investment plans saved yet." /> : null}
        <div className="space-y-4">
          {investments.map((item) => (
            <div key={item.id} className="rounded-[28px] border border-white/8 bg-[#071510] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#b4ff45]/12 px-3 py-1 text-xs font-semibold text-[#d8ff9a]">{item.category}</span>
                    <span className="rounded-full bg-cyan-400/12 px-3 py-1 text-xs font-semibold text-cyan-100">{item.investment_mode}</span>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/72">{item.risk_profile} risk</span>
                    {item.goal_id ? <span className="rounded-full bg-fuchsia-400/12 px-3 py-1 text-xs font-semibold text-fuchsia-100">Goal linked</span> : null}
                    {item.is_paused ? <span className="rounded-full bg-rose-400/12 px-3 py-1 text-xs font-semibold text-rose-100">Paused</span> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{item.fund_name}</h3>
                  <p className="text-sm text-white/54">{item.frequency} contribution planned for {formatCurrency(item.amount)}</p>
                  {item.scheme_code ? <p className="mt-1 text-xs text-white/42">Scheme code: {item.scheme_code}</p> : null}
                </div>
                <div className="space-y-4 xl:min-w-[340px]">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <DataPill label="Ticket size" value={formatCurrency(item.amount)} />
                    <DataPill label="Frequency" value={item.frequency} />
                    <DataPill label="Suitability" value={item.risk_profile} />
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button onClick={() => void togglePause(item)} className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/86 transition hover:bg-white/8">{item.is_paused ? "Resume SIP" : "Pause SIP"}</button>
                    <button onClick={() => void deleteInvestment(item.id)} className="rounded-full border border-rose-300/20 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/10">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SurfacePanel>
    </section>
  );
}
