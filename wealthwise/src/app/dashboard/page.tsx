"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_gain: number;
  gain_pct: number;
  fund_count: number;
  active_sips: number;
}

interface FundPerformance {
  fund_id: string;
  fund_name: string;
  category: string;
  amc: string;
  latest_nav: number;
  total_units: number;
  invested: number;
  current_value: number;
  gain: number;
  gain_pct: number;
}

interface AllocationItem {
  category: string;
  current_value: number;
  invested: number;
  pct: number;
}

const CAT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Equity: { bg: "bg-violet-100", text: "text-violet-700", bar: "bg-violet-500" },
  Debt: { bg: "bg-sky-100", text: "text-sky-700", bar: "bg-sky-500" },
  Hybrid: { bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-500" },
  Gold: { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500" },
  Liquid: { bg: "bg-teal-100", text: "text-teal-700", bar: "bg-teal-500" },
  Other: { bg: "bg-rose-100", text: "text-rose-700", bar: "bg-rose-500" },
};

function catColor(cat: string) {
  return CAT_COLORS[cat] ?? CAT_COLORS.Other;
}

function fmt(n: number | null | undefined): string {
  const v = Number(n);
  if (!isFinite(v)) return "₹0";
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)} L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)} K`;
  return `₹${v.toFixed(0)}`;
}

function safePct(n: number | null | undefined): string {
  const v = Number(n);
  if (!isFinite(v)) return "0.00%";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function Sparkline({ positive }: { positive: boolean }) {
  const points = positive
    ? "0,30 10,25 20,28 30,18 40,20 50,12 60,15 70,8 80,10 90,4 100,2"
    : "0,5  10,8  20,6  30,15 40,12 50,20 60,18 70,25 80,22 90,28 100,30";
  return (
    <svg viewBox="0 0 100 35" className="w-24 h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none"
        stroke={positive ? "#8b5cf6" : "#f43f5e"}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [funds, setFunds] = useState<FundPerformance[]>([]);
  const [allocation, setAllocation] = useState<AllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"funds" | "allocation">("funds");

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        setUser(user);
        const uid = user.id;

        const [s, f, a] = await Promise.all([
          supabase.rpc("get_portfolio_summary", { p_user_id: uid }),
          supabase.rpc("get_fund_performance", { p_user_id: uid }),
          supabase.rpc("get_asset_allocation", { p_user_id: uid }),
        ]);

        if (s.data) {
          const row = Array.isArray(s.data) ? s.data[0] : s.data;
          if (row) setSummary(row as PortfolioSummary);
        }
        if (f.data && Array.isArray(f.data)) setFunds(f.data as FundPerformance[]);
        if (a.data && Array.isArray(a.data)) setAllocation(a.data as AllocationItem[]);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 font-medium">Loading your portfolio…</p>
      </div>
    </div>
  );

  const totalGain = summary?.total_gain ?? 0;
  const gainPct = summary?.gain_pct ?? 0;
  const currentValue = summary?.current_value ?? 0;
  const totalInvested = summary?.total_invested ?? 0;
  const activeSips = summary?.active_sips ?? 0;
  const fundCount = summary?.fund_count ?? 0;
  const isProfit = totalGain >= 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { background: #020817; }
        .syne { font-family: 'Syne', sans-serif; }
        .dm   { font-family: 'DM Sans', sans-serif; }
        .mesh-bg {
          background:
            radial-gradient(ellipse 80% 50% at 20% 10%,  rgba(139,92,246,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%,  rgba(236,72,153,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 60% 30%,  rgba(251,191,36,0.08) 0%, transparent 60%),
            #020817;
        }
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
        }
        .kpi-violet { background: linear-gradient(135deg,rgba(139,92,246,0.2),rgba(139,92,246,0.05)); border:1px solid rgba(139,92,246,0.3); }
        .kpi-pink   { background: linear-gradient(135deg,rgba(236,72,153,0.2),rgba(236,72,153,0.05)); border:1px solid rgba(236,72,153,0.3); }
        .kpi-amber  { background: linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05)); border:1px solid rgba(251,191,36,0.3); }
        .kpi-teal   { background: linear-gradient(135deg,rgba(20,184,166,0.2),rgba(20,184,166,0.05)); border:1px solid rgba(20,184,166,0.3); }
        .kpi-green  { background: linear-gradient(135deg,rgba(34,197,94,0.2), rgba(34,197,94,0.05));  border:1px solid rgba(34,197,94,0.3); }
        .kpi-rose   { background: linear-gradient(135deg,rgba(244,63,94,0.2), rgba(244,63,94,0.05));  border:1px solid rgba(244,63,94,0.3); }
        .fund-row { transition: background 0.15s; }
        .fund-row:hover { background: rgba(255,255,255,0.06); }
        .tab-active { background: linear-gradient(135deg,#8b5cf6,#ec4899); color:white; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation:fadeUp 0.4s ease both; }
        .delay-1 { animation-delay:0.05s; }
        .delay-2 { animation-delay:0.10s; }
        .delay-3 { animation-delay:0.15s; }
        .delay-4 { animation-delay:0.20s; }
        .delay-5 { animation-delay:0.25s; }
        .delay-6 { animation-delay:0.30s; }
      `}</style>

      <div className="mesh-bg min-h-screen dm text-white">

        {/* NAVBAR */}
        <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-lg">💰</div>
            <span className="syne text-xl font-bold">WealthWise</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">
              {user?.user_metadata?.full_name || user?.email}
            </span>
            <button onClick={handleSignOut}
              className="text-sm px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white transition">
              Sign out
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* TITLE */}
          <div className="fade-up">
            <h1 className="syne text-3xl sm:text-4xl font-extrabold">Portfolio Dashboard</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="kpi-violet rounded-2xl p-5 col-span-2 lg:col-span-1 fade-up delay-1">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">Current Value</p>
              <p className="syne text-3xl font-bold text-violet-300">{fmt(currentValue)}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-500">Portfolio total</span>
                <Sparkline positive={isProfit} />
              </div>
            </div>

            <div className="kpi-teal rounded-2xl p-5 fade-up delay-2">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">Invested</p>
              <p className="syne text-2xl font-bold text-teal-300">{fmt(totalInvested)}</p>
              <p className="text-xs text-slate-500 mt-3">Total deployed</p>
            </div>

            <div className={`${isProfit ? "kpi-green" : "kpi-rose"} rounded-2xl p-5 fade-up delay-3`}>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">Total Gain</p>
              <p className={`syne text-2xl font-bold ${isProfit ? "text-green-400" : "text-rose-400"}`}>
                {fmt(Math.abs(totalGain))}
              </p>
              <p className={`text-xs mt-3 font-semibold ${isProfit ? "text-green-400" : "text-rose-400"}`}>
                {safePct(gainPct)}
              </p>
            </div>

            <div className="kpi-amber rounded-2xl p-5 fade-up delay-4">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">Active SIPs</p>
              <p className="syne text-2xl font-bold text-amber-300">{activeSips}</p>
              <p className="text-xs text-slate-500 mt-3">Running mandates</p>
            </div>

            <div className="kpi-pink rounded-2xl p-5 fade-up delay-5">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">Funds</p>
              <p className="syne text-2xl font-bold text-pink-300">{fundCount}</p>
              <p className="text-xs text-slate-500 mt-3">Unique schemes</p>
            </div>

          </div>

          {/* MAIN CONTENT */}
          <div className="grid lg:grid-cols-3 gap-6 fade-up delay-6">

            {/* Holdings */}
            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="syne text-lg font-bold">Holdings</h2>
                <div className="flex bg-slate-900 rounded-xl p-1 gap-1">
                  {(["funds", "allocation"] as const).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg capitalize transition ${activeTab === t ? "tab-active" : "text-slate-400 hover:text-white"
                        }`}>
                      {t === "funds" ? "By Fund" : "By Category"}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === "funds" && (
                <div className="space-y-1">
                  {funds.length === 0
                    ? <EmptyState icon="📊" title="No investments yet" sub="Add your first SIP or lump-sum to get started" />
                    : funds.map(f => (
                      <div key={f.fund_id} className="fund-row rounded-xl px-4 py-3 flex items-center justify-between gap-4 cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${catColor(f.category).bg} ${catColor(f.category).text}`}>
                            {(f.category ?? "OT").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate max-w-[220px]">{f.fund_name}</p>
                            <p className="text-xs text-slate-500">{f.amc} · {Number(f.total_units ?? 0).toFixed(3)} units</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold">{fmt(f.current_value)}</p>
                          <p className={`text-xs font-semibold ${Number(f.gain_pct ?? 0) >= 0 ? "text-green-400" : "text-rose-400"}`}>
                            {safePct(f.gain_pct)}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {activeTab === "allocation" && (
                <div className="space-y-4">
                  {allocation.length === 0
                    ? <EmptyState icon="🥧" title="No allocation data" sub="Add investments to see your asset allocation" />
                    : allocation.map(a => {
                      const c = catColor(a.category);
                      const pv = Number(a.pct ?? 0);
                      return (
                        <div key={a.category}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.bg} ${c.text}`}>{a.category}</span>
                            <div className="text-right">
                              <span className="text-sm font-semibold">{fmt(a.current_value)}</span>
                              <span className="text-xs text-slate-500 ml-2">{pv.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                              style={{ width: `${Math.min(pv, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6">
                <h2 className="syne text-lg font-bold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <ActionButton icon="➕" label="Add Investment" sub="SIP or lump-sum" gradient="from-violet-600 to-violet-800" onClick={() => router.push("/dashboard/investments/new")} />
                  <ActionButton icon="🎯" label="Set a Goal" sub="Retirement, home, etc." gradient="from-pink-600 to-rose-700" onClick={() => router.push("/dashboard/goals/new")} />
                  <ActionButton icon="📈" label="View Analytics" sub="XIRR, CAGR, tax" gradient="from-amber-500 to-orange-600" onClick={() => router.push("/dashboard/analytics")} />
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="syne text-lg font-bold mb-4">Portfolio Health</h2>
                <div className="space-y-3">
                  <HealthRow label="Diversification" value={fundCount >= 5 ? "Good" : fundCount >= 3 ? "Fair" : "Low"} positive={fundCount >= 5} />
                  <HealthRow label="SIP Consistency" value={activeSips > 0 ? "Active" : "No SIPs"} positive={activeSips > 0} />
                  <HealthRow label="Returns" value={isProfit ? "Positive" : "Negative"} positive={isProfit} />
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM NAV */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up">
            {[
              { icon: "💼", label: "Investments", href: "/dashboard/investments", color: "from-violet-500/20 to-violet-500/5 border-violet-500/30" },
              { icon: "🎯", label: "Goals", href: "/dashboard/goals", color: "from-pink-500/20 to-pink-500/5 border-pink-500/30" },
              { icon: "📊", label: "Analytics", href: "/dashboard/analytics", color: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
              { icon: "🔔", label: "Alerts", href: "/dashboard/notifications", color: "from-teal-500/20 to-teal-500/5 border-teal-500/30" },
            ].map(item => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className={`bg-gradient-to-br ${item.color} border rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform`}>
                <span className="text-2xl block mb-2">{item.icon}</span>
                <span className="syne text-sm font-bold">{item.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="text-center py-12">
      <span className="text-4xl block mb-3">{icon}</span>
      <p className="text-white font-semibold mb-1">{title}</p>
      <p className="text-slate-500 text-sm">{sub}</p>
    </div>
  );
}

function ActionButton({ icon, label, sub, gradient, onClick }: {
  icon: string; label: string; sub: string; gradient: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 bg-gradient-to-r ${gradient} rounded-xl px-4 py-3 hover:opacity-90 transition text-left`}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-white/60">{sub}</p>
      </div>
    </button>
  );
}

function HealthRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${positive ? "bg-green-500/20 text-green-400" : "bg-rose-500/20 text-rose-400"}`}>
        {value}
      </span>
    </div>
  );
}