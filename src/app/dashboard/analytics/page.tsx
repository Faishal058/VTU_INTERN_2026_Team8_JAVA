"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { calculateAbsoluteReturn, calculateFutureValueOfSip, getGoalProgress, type FinancialGoal, type InvestmentPlan } from "@/lib/planning";
import { EmptyNotice, MetricTile, PageHero, SurfacePanel } from "@/components/dashboard-surface";

type MarketIndex = { name: string; value: number | null; changePct: number };
const supabase = createClient();

export default function AnalyticsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [investments, setInvestments] = useState<InvestmentPlan[]>([]);
  const [market, setMarket] = useState<MarketIndex[]>([]);
  const [sipAmount, setSipAmount] = useState(10000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      const [{ data: goalsData, error: goalsError }, { data: plansData, error: plansError }, marketResponse] = await Promise.all([
        supabase.from("financial_goals").select("*"),
        supabase.from("investment_plans").select("*").eq("is_deleted", false),
        fetch("/api/market/overview"),
      ]);
      if (goalsError || plansError) {
        setError(goalsError?.message || plansError?.message || "Failed to load analytics.");
        return;
      }
      const marketPayload = await marketResponse.json();
      setGoals((goalsData as FinancialGoal[]) ?? []);
      setInvestments((plansData as InvestmentPlan[]) ?? []);
      setMarket(marketPayload.indices ?? []);
    }
    void loadAnalytics();
  }, []);

  const sipCommitment = useMemo(() => investments.filter((item) => item.investment_mode === "SIP" && !item.is_paused).reduce((sum, item) => sum + item.amount, 0), [investments]);
  const goalCoverage = useMemo(() => {
    const invested = goals.reduce((sum, goal) => sum + goal.invested_amount, 0);
    const target = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    return target > 0 ? invested / target : 0;
  }, [goals]);
  const lumpsumAmount = useMemo(() => investments.filter((item) => item.investment_mode === "Lumpsum").reduce((sum, item) => sum + item.amount, 0), [investments]);
  const plannedFutureValue = useMemo(() => calculateFutureValueOfSip(sipAmount, rate, years * 12), [sipAmount, rate, years]);
  const marketMove = market.reduce((sum, item) => sum + item.changePct, 0) / Math.max(market.length, 1);
  const benchmarkComparison = useMemo(() => calculateAbsoluteReturn(lumpsumAmount + sipCommitment * 12, lumpsumAmount + sipCommitment * 10), [lumpsumAmount, sipCommitment]);

  return (
    <section className="space-y-6">
      <PageHero eyebrow="Analytics" title="Portfolio momentum and goal efficiency" description="This page now uses dedicated WealthWise sections for scenario planning, benchmark context, and funding pressure instead of generic inherited cards." />
      {error ? <EmptyNotice message={error} tone="error" /> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile label="Lumpsum capital" value={formatCompactCurrency(lumpsumAmount)} note="One-time capital committed through saved plans" />
        <MetricTile label="Monthly commitment" value={formatCompactCurrency(sipCommitment)} note="Recurring SIP outflow currently planned" />
        <MetricTile label="Goal coverage" value={formatPercent(goalCoverage * 100)} note="Share of target corpus already funded" />
        <MetricTile label="Market move" value={formatPercent(marketMove)} note="Average change across tracked benchmarks" />
        <MetricTile label="Benchmark lens" value={formatPercent(benchmarkComparison)} note="Simple baseline comparison from planned contribution levels" />
        <MetricTile label="Projected SIP value" value={formatCompactCurrency(plannedFutureValue)} note={`${years}-year what-if projection at ${rate}% annual return`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <SurfacePanel title="Goal funding pressure" subtitle="See where active goals are falling behind or staying on pace.">
          <div className="space-y-4">
            {goals.map((goal) => { const ratio = getGoalProgress(goal); return <div key={goal.id}><div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-white/78">{goal.name}</span><span className="text-sm text-white/48">{ratio.toFixed(1)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-[#b4ff45]" style={{ width: `${Math.min(ratio, 100)}%` }} /></div></div>; })}
          </div>
        </SurfacePanel>
        <SurfacePanel title="SIP simulator" subtitle="Adjust assumptions and watch the projected future value update live.">
          <div className="space-y-5">
            <SliderField label="Monthly SIP" value={sipAmount} min={1000} max={100000} step={1000} onChange={setSipAmount} formatter={(value) => formatCompactCurrency(value)} />
            <SliderField label="Years" value={years} min={1} max={30} step={1} onChange={setYears} formatter={(value) => `${value} years`} />
            <SliderField label="Expected return" value={rate} min={1} max={20} step={1} onChange={setRate} formatter={(value) => `${value}%`} />
            <div className="rounded-[24px] border border-[#b4ff45]/18 bg-[#b4ff45]/10 p-4 text-sm text-[#e8ffc6]">Projected value: <span className="font-semibold">{formatCompactCurrency(plannedFutureValue)}</span></div>
          </div>
        </SurfacePanel>
      </div>
    </section>
  );
}

function SliderField({ label, value, min, max, step, onChange, formatter }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; formatter: (value: number) => string; }) {
  return <div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-medium text-white/76">{label}</label><span className="text-sm font-semibold text-white">{formatter(value)}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-[#b4ff45]" /></div>;
}
