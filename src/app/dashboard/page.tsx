"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { formatCompactCurrency, formatCurrency, formatDate, formatPercent } from "@/lib/format";
import type { FinancialGoal, InvestmentTransaction } from "@/lib/planning";
import { DataPill, EmptyNotice, GhostButton, MetricTile, PageHero, SurfacePanel } from "@/components/dashboard-surface";

const supabase = createClient();

// TYPE DEFINITIONS for Dashboard Data

type PortfolioSummary = {
  total_invested: number;
  current_value: number;
  total_gain: number;
  gain_pct: number;
  fund_count: number;
  active_sips: number;
};

type FundPerformance = {
  fund_id: string;
  fund_name: string;
  category: string;
  amc: string;
  total_units: number;
  current_value: number;
  gain_pct: number;
};

type AllocationItem = {
  category: string;
  current_value: number;
  pct: number;
};

type MarketIndex = { name: string; value: number | null; changePct: number };

/**
 * DashboardPage: The primary internal surface for WealthWise.
 * Displays portfolio metrics, top holdings, asset allocation, goal progress, and market context.
 */
export default function DashboardPage() {
  const router = useRouter();
  
  // State for all dashboard modules
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [funds, setFunds] = useState<FundPerformance[]>([]);
  const [allocation, setAllocation] = useState<AllocationItem[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [market, setMarket] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Initial data load for the entire dashboard.
     * Fetches portfolio, holdings, goals, and market snapshots in parallel.
     */
    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login"); // Safety redirect if middleware is bypassed
          return;
        }

        // Parallel execution of portfolio RPCs and market API
        const [summaryResult, fundResult, allocationResult, goalRows, txnRows, marketResponse] = await Promise.all([
          supabase.rpc("get_portfolio_summary", { p_user_id: user.id }),
          supabase.rpc("get_fund_performance", { p_user_id: user.id }),
          supabase.rpc("get_asset_allocation", { p_user_id: user.id }),
          supabase.from("financial_goals").select("*").eq("status", "Active").order("target_date", { ascending: true }).limit(3),
          supabase.from("investment_transactions").select("*").order("transaction_date", { ascending: false }).limit(10),
          fetch("/api/market/overview"),
        ]);

        const marketPayload = await marketResponse.json();
        setMarket(marketPayload.indices ?? []);

        // Process RPC results (PostgREST returns single objects as arrays sometimes depending on RPC definition)
        if (summaryResult.data) {
          const row = Array.isArray(summaryResult.data) ? summaryResult.data[0] : summaryResult.data;
          setSummary(row as PortfolioSummary);
        }
        
        if (Array.isArray(fundResult.data)) setFunds(fundResult.data as FundPerformance[]);
        if (Array.isArray(allocationResult.data)) setAllocation(allocationResult.data as AllocationItem[]);
        
        setGoals((goalRows.data as FinancialGoal[]) ?? []);
        setTransactions((txnRows.data as InvestmentTransaction[]) ?? []);
        
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [router]);

  /**
   * Handle Session Termination
   */
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Derived metrics for display
  const currentValue = summary?.current_value ?? 0;
  const totalInvested = summary?.total_invested ?? 0;
  const gain = summary?.total_gain ?? 0;
  const gainPct = summary?.gain_pct ?? 0;
  const fundCount = summary?.fund_count ?? 0;
  const activeSips = summary?.active_sips ?? 0;
  
  const topGainer = useMemo(() => [...funds].sort((a, b) => b.gain_pct - a.gain_pct)[0], [funds]);
  const topLoser = useMemo(() => [...funds].sort((a, b) => a.gain_pct - b.gain_pct)[0], [funds]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><EmptyNotice message="Loading portfolio overview..." /></div>;
  }

  return (
    <section className="space-y-6">
      {/* Top Hero Section */}
      <PageHero
        eyebrow="Overview"
        title="Your investing command center"
        description="Live portfolio movement, goal progress, market context, and recent actions all in one WealthWise surface."
        action={<GhostButton onClick={() => void handleSignOut()}>Sign out</GhostButton>}
      />

      {/* Primary KPI Tiles */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Current value" value={formatCompactCurrency(currentValue)} note="Real-time portfolio snapshot" />
        <MetricTile label="Total invested" value={formatCompactCurrency(totalInvested)} note="Capital currently deployed" />
        <MetricTile label="Portfolio gain" value={formatCompactCurrency(gain)} note="Absolute growth from holdings" />
        <MetricTile label="Return" value={formatPercent(gainPct)} note="Performance across tracked plans" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.85fr]">
        <div className="space-y-6">
          {/* Top Holdings Module */}
          <SurfacePanel title="Top holdings" subtitle="Your strongest visible positions and their current performance." action={<Link href="/dashboard/investments" className="text-sm font-semibold text-[#d8ff9a]">View all</Link>}>
            <div className="space-y-4">
              {funds.length === 0 ? <EmptyNotice message="No holding data returned yet." /> : funds.slice(0, 4).map((fund) => (
                <div key={fund.fund_id} className="rounded-[26px] border border-white/8 bg-[#071510] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{fund.fund_name}</p>
                      <p className="text-sm text-white/52">{fund.amc} | {fund.category} | {fund.total_units.toFixed(3)} units</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-base font-semibold text-white">{formatCompactCurrency(fund.current_value)}</p>
                      <p className={`text-sm font-semibold ${fund.gain_pct >= 0 ? "text-[#d8ff9a]" : "text-rose-200"}`}>{formatPercent(fund.gain_pct)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SurfacePanel>

          {/* Asset Allocation Breakdown */}
          <SurfacePanel title="Allocation mix" subtitle="How your current portfolio is spread across categories.">
            <div className="space-y-4">
              {allocation.length === 0 ? <EmptyNotice message="Allocation data has not been returned yet." /> : allocation.map((item) => (
                <div key={item.category}>
                  <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-white/78">{item.category}</span><span className="text-sm text-white/48">{item.pct.toFixed(1)}%</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-[#b4ff45] to-cyan-300" style={{ width: `${Math.min(item.pct, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </SurfacePanel>

          {/* Transaction History Log */}
          <SurfacePanel title="Recent transactions" subtitle="Latest portfolio actions captured from your transaction log." action={<Link href="/dashboard/transactions" className="text-sm font-semibold text-[#d8ff9a]">Open log</Link>}>
            <div className="space-y-3">
              {transactions.length === 0 ? <EmptyNotice message="Transactions will appear here once you record them." /> : transactions.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-[22px] border border-white/8 bg-[#071510] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.transaction_type} • {formatCurrency(item.amount)}</p>
                    <p className="text-xs text-white/46">{formatDate(item.transaction_date)} • {item.status}</p>
                  </div>
                  <span className="text-xs font-semibold text-white/62">{item.units ? `${item.units.toFixed(3)} units` : "-"}</span>
                </div>
              ))}
            </div>
          </SurfacePanel>
        </div>

        <div className="space-y-6">
          {/* Portfolio Health Summary */}
          <SurfacePanel title="Health snapshot" subtitle="Quick signals that help you judge plan quality at a glance.">
            <div className="space-y-3">
              <DataPill label="Funds tracked" value={String(fundCount)} />
              <DataPill label="Active SIPs" value={String(activeSips)} />
              <DataPill label="Allocation buckets" value={String(allocation.length)} />
              <DataPill label="Top gainer" value={topGainer ? `${topGainer.fund_name} (${formatPercent(topGainer.gain_pct)})` : "-"} />
              <DataPill label="Top loser" value={topLoser ? `${topLoser.fund_name} (${formatPercent(topLoser.gain_pct)})` : "-"} />
            </div>
          </SurfacePanel>

          {/* Goal Visualization */}
          <SurfacePanel title="Goal progress" subtitle="The nearest active goals and the contribution pressure behind them." action={<Link href="/dashboard/goals" className="text-sm font-semibold text-[#d8ff9a]">Open goals</Link>}>
            <div className="space-y-4">
              {goals.length === 0 ? <EmptyNotice message="Add active goals to track progress here." /> : goals.map((goal) => {
                const progress = Math.min((goal.invested_amount / Math.max(goal.target_amount, 1)) * 100, 100);
                return (
                  <div key={goal.id}>
                    <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-white/78">{goal.name}</span><span className="text-xs text-white/45">{progress.toFixed(1)}%</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-[#b4ff45]" style={{ width: `${progress}%` }} /></div>
                    <p className="mt-2 text-xs text-white/46">Need {formatCompactCurrency(goal.monthly_need)} monthly</p>
                  </div>
                );
              })}
            </div>
          </SurfacePanel>

          {/* Live Market Tickers */}
          <SurfacePanel title="Market overview" subtitle="Benchmarks pulled into the portfolio lens.">
            <div className="space-y-3">
              {market.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-[22px] border border-white/8 bg-[#071510] px-4 py-3">
                  <div><p className="text-sm font-semibold text-white">{item.name}</p><p className="text-xs text-white/46">Index snapshot</p></div>
                  <div className="text-right"><p className="text-sm font-semibold text-white">{item.value ? item.value.toFixed(2) : "Unavailable"}</p><p className={`text-xs font-semibold ${item.changePct >= 0 ? "text-[#d8ff9a]" : "text-rose-200"}`}>{formatPercent(item.changePct)}</p></div>
                </div>
              ))}
            </div>
          </SurfacePanel>
        </div>
      </div>
    </section>
  );
}
