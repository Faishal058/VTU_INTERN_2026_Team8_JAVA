"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { buildCapitalGainLots, summarizeCapitalGains, type InvestmentTransaction } from "@/lib/planning";
import { DataPill, EmptyNotice, MetricTile, PageHero, SurfacePanel } from "@/components/dashboard-surface";

const supabase = createClient();

export default function TaxPage() {
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);

  useEffect(() => {
    async function loadTransactions() {
      const { data } = await supabase.from("investment_transactions").select("*").order("transaction_date", { ascending: false });
      setTransactions((data as InvestmentTransaction[]) ?? []);
    }
    void loadTransactions();
  }, []);

  const lots = useMemo(() => buildCapitalGainLots(transactions), [transactions]);
  const summary = useMemo(() => summarizeCapitalGains(lots), [lots]);

  return (
    <section className="space-y-6">
      <PageHero eyebrow="Tax" title="Capital gains and tax estimate" description="FIFO-derived gain lots now live inside a dedicated WealthWise tax surface instead of a generic data block." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="STCG" value={formatCurrency(summary.stcg)} />
        <MetricTile label="LTCG" value={formatCurrency(summary.ltcg)} />
        <MetricTile label="Estimated STCG tax" value={formatCurrency(summary.stcgTax)} />
        <MetricTile label="Estimated total tax" value={formatCurrency(summary.totalTax)} />
      </div>
      <SurfacePanel title="Lots" subtitle="Derived from BUY and SELL transaction sequences.">
        <div className="space-y-4">
          {lots.length === 0 ? <EmptyNotice message="Add SELL transactions to generate tax lots." /> : null}
          {lots.map((lot, index) => <div key={`${lot.buyDate}-${lot.sellDate}-${index}`} className="grid gap-3 rounded-[26px] border border-white/8 bg-[#071510] p-5 md:grid-cols-5"><DataPill label="Buy date" value={lot.buyDate} /><DataPill label="Sell date" value={lot.sellDate} /><DataPill label="Units" value={lot.units.toFixed(4)} /><DataPill label="Gain" value={formatCurrency(lot.gain)} /><DataPill label="Bucket" value={lot.taxCategory} /></div>)}
        </div>
      </SurfacePanel>
    </section>
  );
}
