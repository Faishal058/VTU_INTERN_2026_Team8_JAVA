"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { FinancialGoal, MutualFundSearchResult } from "@/lib/planning";
import { EmptyNotice, GhostButton, PageHero, SurfacePanel } from "@/components/dashboard-surface";

export default function NewInvestmentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MutualFundSearchResult[]>([]);
  const [form, setForm] = useState({ fundName: "", schemeCode: "", amc: "", category: "", goalId: "", investmentMode: "SIP", amount: "", nav: "", frequency: "Monthly", startDate: "", note: "", riskProfile: "Moderate" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGoals() {
      const { data } = await supabase.from("financial_goals").select("*").eq("status", "Active").order("target_date", { ascending: true });
      setGoals((data as FinancialGoal[]) ?? []);
    }
    void loadGoals();
  }, [supabase]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const response = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const payload = await response.json();
        setSearchResults(payload.results ?? []);
      } catch {
        setSearchResults([]);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  function selectFund(result: MutualFundSearchResult) {
    setForm((current) => ({ ...current, fundName: result.schemeName, schemeCode: result.schemeCode, amc: result.fundHouse, category: result.category }));
    setQuery(result.schemeName);
    setSearchResults([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in again before saving an investment.");
      setSubmitting(false);
      return;
    }
    const amount = Number(form.amount);
    const nav = form.nav ? Number(form.nav) : null;
    if (!form.fundName || !form.amc || !form.category || !amount) {
      setError("Select a fund and enter the amount to continue.");
      setSubmitting(false);
      return;
    }
    const units = nav && nav > 0 ? amount / nav : null;
    const { data, error } = await supabase.from("investment_plans").insert({ user_id: user.id, fund_name: form.fundName, scheme_code: form.schemeCode || null, amc: form.amc, category: form.category, goal_id: form.goalId || null, investment_mode: form.investmentMode, amount, frequency: form.frequency, start_date: form.startDate || null, note: form.note || null, risk_profile: form.riskProfile }).select("id").single();
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    await supabase.from("investment_transactions").insert({ user_id: user.id, investment_plan_id: data.id, transaction_type: "BUY", amount, nav, units, transaction_date: form.startDate || new Date().toISOString().slice(0, 10), status: form.investmentMode === "SIP" ? "Scheduled" : "Completed", notes: form.note || null });
    await supabase.from("user_alerts").insert({ user_id: user.id, title: `${form.investmentMode} created`, description: `${form.fundName} was saved with an amount of Rs ${amount.toLocaleString("en-IN")}.`, severity: form.investmentMode === "SIP" ? "Info" : "Watch", source_type: "investment_plan", source_id: data.id });
    setSubmitting(false);
    router.push("/dashboard/investments");
  }

  return (
    <section className="space-y-6">
      <PageHero eyebrow="New investment" title="Capture a SIP or lump-sum order" description="The creation flow now uses the same WealthWise section language as the rest of the dashboard." />
      <SurfacePanel title="Investment details" subtitle="Search a fund, attach a goal, and save the contribution plan.">
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-white/72">Mutual fund search</label>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by fund name or AMC" className="ww-auth-input" />
            {searchResults.length > 0 ? <div className="mt-2 overflow-hidden rounded-[22px] border border-white/10 bg-[#071510]">{searchResults.map((result) => <button type="button" key={result.schemeCode} onClick={() => selectFund(result)} className="block w-full border-b border-white/8 px-4 py-3 text-left last:border-b-0 hover:bg-white/6"><p className="text-sm font-semibold text-white">{result.schemeName}</p><p className="text-xs text-white/45">{result.fundHouse} • {result.category} • {result.schemeCode}</p></button>)}</div> : null}
          </div>
          <Field label="Fund name" value={form.fundName} onChange={(value) => setForm((current) => ({ ...current, fundName: value }))} />
          <Field label="Scheme code" value={form.schemeCode} onChange={(value) => setForm((current) => ({ ...current, schemeCode: value }))} />
          <Field label="AMC" value={form.amc} onChange={(value) => setForm((current) => ({ ...current, amc: value }))} />
          <Field label="Category" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
          <SelectField label="Linked goal" value={form.goalId} options={[{ value: "", label: "No goal linked" }, ...goals.map((goal) => ({ value: goal.id, label: goal.name }))]} onChange={(value) => setForm((current) => ({ ...current, goalId: value }))} />
          <SelectField label="Investment mode" value={form.investmentMode} options={[{ value: "SIP", label: "SIP" }, { value: "Lumpsum", label: "Lumpsum" }]} onChange={(value) => setForm((current) => ({ ...current, investmentMode: value }))} />
          <Field label="Amount" type="number" value={form.amount} onChange={(value) => setForm((current) => ({ ...current, amount: value }))} />
          <Field label="NAV at purchase" type="number" value={form.nav} onChange={(value) => setForm((current) => ({ ...current, nav: value }))} />
          <Field label="Frequency" value={form.frequency} onChange={(value) => setForm((current) => ({ ...current, frequency: value }))} />
          <Field label="Start date" type="date" value={form.startDate} onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} />
          <SelectField label="Risk profile" value={form.riskProfile} options={[{ value: "Low", label: "Low" }, { value: "Moderate", label: "Moderate" }, { value: "High", label: "High" }]} onChange={(value) => setForm((current) => ({ ...current, riskProfile: value }))} />
          <div className="lg:col-span-2"><label className="mb-2 block text-sm font-medium text-white/72">Why this fund</label><textarea rows={4} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="ww-auth-input" /></div>
          <div className="lg:col-span-2 flex flex-wrap gap-3"><button type="submit" disabled={submitting} className="rounded-full bg-[#b4ff45] px-5 py-3 text-sm font-semibold text-[#062415] transition hover:bg-[#c6ff74]">{submitting ? "Saving..." : "Save investment"}</button><GhostButton type="button" onClick={() => router.push("/dashboard/investments")}>Back to investments</GhostButton></div>
          {error ? <div className="lg:col-span-2"><EmptyNotice message={error} tone="error" /></div> : null}
        </form>
      </SurfacePanel>
    </section>
  );
}

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void; }) { return <div><label className="mb-2 block text-sm font-medium text-white/72">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="ww-auth-input" /></div>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; }) { return <div><label className="mb-2 block text-sm font-medium text-white/72">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="ww-auth-input">{options.map((option) => <option key={option.value || option.label} value={option.value}>{option.label}</option>)}</select></div>; }
