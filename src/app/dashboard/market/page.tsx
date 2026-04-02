"use client";

import { useEffect, useState } from "react";

import { EmptyNotice, PageHero, SurfacePanel } from "@/components/dashboard-surface";

type MarketIndex = { name: string; value: number | null; changePct: number };
type FundSearchResult = { schemeCode: string; schemeName: string; fundHouse: string; category: string };

export default function MarketPage() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [query, setQuery] = useState("parag");
  const [results, setResults] = useState<FundSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarket() {
      const response = await fetch("/api/market/overview");
      const payload = await response.json();
      setIndices(payload.indices ?? []);
      setLoading(false);
    }
    void loadMarket();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      const response = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`);
      const payload = await response.json();
      setResults(payload.results ?? []);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <section className="space-y-6">
      <PageHero eyebrow="Market" title="Data sources and market overview" description="Benchmarks, fund discovery, and sync operations now live in page-specific WealthWise sections rather than generic dashboard blocks." />
      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SurfacePanel title="Benchmarks" subtitle="Latest index snapshots available to the portfolio dashboard.">
          <div className="space-y-3">
            {loading ? <EmptyNotice message="Loading market data..." /> : null}
            {indices.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-[22px] border border-white/8 bg-[#071510] px-4 py-3">
                <div><p className="text-sm font-semibold text-white">{item.name}</p><p className="text-xs text-white/45">Latest index snapshot</p></div>
                <div className="text-right"><p className="text-sm font-semibold text-white">{item.value ? item.value.toFixed(2) : "Unavailable"}</p><p className={`text-xs font-semibold ${item.changePct >= 0 ? "text-[#d8ff9a]" : "text-rose-200"}`}>{item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%</p></div>
              </div>
            ))}
          </div>
        </SurfacePanel>
        <SurfacePanel title="Fund lookup" subtitle="Search the AMFI-backed fund feed through the app API.">
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="ww-auth-input" placeholder="Search fund name or AMC" />
          <div className="mt-5 space-y-3">
            {results.length === 0 ? <EmptyNotice message="No funds matched the current search." /> : null}
            {results.map((item) => <div key={item.schemeCode} className="rounded-[22px] border border-white/8 bg-[#071510] px-4 py-3"><p className="text-sm font-semibold text-white">{item.schemeName}</p><p className="text-xs text-white/45">{item.fundHouse} | {item.category} | {item.schemeCode}</p></div>)}
          </div>
        </SurfacePanel>
      </div>
      <SurfacePanel title="Sync operations" subtitle="The background tasks and feeds that support market-aware product views.">
        <div className="space-y-3 text-sm text-white/62">
          <div className="rounded-[22px] border border-white/8 bg-[#071510] p-4">`scripts/sync_fund_master.py` downloads the AMFI feed and stores local snapshots plus Supabase cache rows.</div>
          <div className="rounded-[22px] border border-white/8 bg-[#071510] p-4">`scripts/sync_market_snapshots.py` captures benchmark index values and writes them into market cache tables.</div>
          <div className="rounded-[22px] border border-white/8 bg-[#071510] p-4">The Windows setup guide explains how to run both scripts manually or through Task Scheduler.</div>
        </div>
      </SurfacePanel>
    </section>
  );
}
