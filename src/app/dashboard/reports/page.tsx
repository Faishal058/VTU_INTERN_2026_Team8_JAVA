"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { buildCapitalGainLots, summarizeCapitalGains, type FinancialGoal, type InvestmentPlan, type InvestmentTransaction, type UserAlert } from "@/lib/planning";
import { DataPill, EmptyNotice, MetricTile, PageHero, SurfacePanel } from "@/components/dashboard-surface";

export default function ReportsPage() {
  const supabase = createClient();
  const [investments, setInvestments] = useState<InvestmentPlan[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);

  useEffect(() => {
    async function loadData() {
      const [plans, txns, goalRows, alertRows] = await Promise.all([
        supabase.from("investment_plans").select("*").eq("is_deleted", false),
        supabase.from("investment_transactions").select("*"),
        supabase.from("financial_goals").select("*"),
        supabase.from("user_alerts").select("*"),
      ]);
      setInvestments((plans.data as InvestmentPlan[]) ?? []);
      setTransactions((txns.data as InvestmentTransaction[]) ?? []);
      setGoals((goalRows.data as FinancialGoal[]) ?? []);
      setAlerts((alertRows.data as UserAlert[]) ?? []);
    }
    queueMicrotask(() => { void loadData(); });
  }, [supabase]);

  const gainLots = useMemo(() => buildCapitalGainLots(transactions), [transactions]);
  const gainSummary = useMemo(() => summarizeCapitalGains(gainLots), [gainLots]);
  const totalInvested = useMemo(() => investments.reduce((sum, item) => sum + item.amount, 0), [investments]);

  function exportCsv(filename: string, rows: Record<string, unknown>[]) {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <PageHero eyebrow="Reports" title="Tax and export center" description="Your reporting pages now use dedicated WealthWise sections for gain lots, exports, and filing notes." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Invested capital" value={formatCurrency(totalInvested)} />
        <MetricTile label="STCG tax" value={formatCurrency(gainSummary.stcgTax)} />
        <MetricTile label="LTCG tax" value={formatCurrency(gainSummary.ltcgTax)} />
        <MetricTile label="Estimated total tax" value={formatCurrency(gainSummary.totalTax)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfacePanel title="Capital gains statement" subtitle="FIFO lots are derived from your transaction history." action={<button onClick={() => exportCsv("capital-gains.csv", gainLots)} className="rounded-full bg-[#b4ff45] px-4 py-2 text-sm font-semibold text-[#062415]">Download CSV</button>}>
          <div className="space-y-4">
            {gainLots.length === 0 ? <EmptyNotice message="No SELL transactions available for tax computation yet." /> : null}
            {gainLots.map((lot, index) => (
              <div key={`${lot.buyDate}-${lot.sellDate}-${index}`} className="grid gap-3 rounded-[26px] border border-white/8 bg-[#071510] p-5 md:grid-cols-4">
                <DataPill label="Buy date" value={lot.buyDate} />
                <DataPill label="Sell date" value={lot.sellDate} />
                <DataPill label="Gain" value={formatCurrency(lot.gain)} />
                <DataPill label="Tax bucket" value={lot.taxCategory} />
              </div>
            ))}
          </div>
        </SurfacePanel>
        <div className="space-y-6">
          <SurfacePanel title="Exports" subtitle="Download raw CSVs from the same page-level visual system.">
            <div className="grid gap-3">
              <ExportButton label="Investments CSV" onClick={() => exportCsv("investment-plans.csv", investments)} />
              <ExportButton label="Transactions CSV" onClick={() => exportCsv("transactions.csv", transactions)} />
              <ExportButton label="Goals CSV" onClick={() => exportCsv("goals.csv", goals)} />
              <ExportButton label="Alerts CSV" onClick={() => exportCsv("alerts.csv", alerts)} />
            </div>
          </SurfacePanel>
          <SurfacePanel title="Tax notes" subtitle="Reference notes for the current estimate logic.">
            <div className="space-y-3 text-sm text-white/62">
              <div className="rounded-[22px] border border-white/8 bg-[#071510] p-4">STCG is estimated at 20% on positive short-term gains.</div>
              <div className="rounded-[22px] border border-white/8 bg-[#071510] p-4">LTCG is estimated at 12.5% after the Rs 1.25L annual exemption.</div>
              <div className="rounded-[22px] border border-white/8 bg-[#071510] p-4">Calculations use FIFO allocation from your BUY and SELL transaction history.</div>
            </div>
          </SurfacePanel>
        </div>
      </div>
    </section>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-[22px] border border-white/10 bg-[#071510] px-4 py-3 text-left text-sm font-semibold text-white/86 transition hover:bg-white/8">{label}</button>;
}
