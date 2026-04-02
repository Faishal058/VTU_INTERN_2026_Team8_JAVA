"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildCapitalGainLots, summarizeCapitalGains, type InvestmentPlan, type InvestmentTransaction } from "@/lib/planning";
import { DataPill, EmptyNotice, MetricTile, PageHero, SurfacePanel } from "@/components/dashboard-surface";

const supabase = createClient();

export default function TransactionsPage() {
  const [investments, setInvestments] = useState<InvestmentPlan[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [form, setForm] = useState({ investmentPlanId: "", transactionType: "BUY", amount: "", nav: "", units: "", transactionDate: new Date().toISOString().slice(0, 10), status: "Completed", notes: "" });
  const [message, setMessage] = useState<string | null>(null);

  async function loadData() {
    const [plans, txns] = await Promise.all([
      supabase.from("investment_plans").select("*").eq("is_deleted", false).order("created_at", { ascending: false }),
      supabase.from("investment_transactions").select("*").order("transaction_date", { ascending: false }),
    ]);
    setInvestments((plans.data as InvestmentPlan[]) ?? []);
    setTransactions((txns.data as InvestmentTransaction[]) ?? []);
  }

  useEffect(() => { queueMicrotask(() => { void loadData(); }); }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const amount = Number(form.amount);
    const nav = form.nav ? Number(form.nav) : null;
    const units = form.units ? Number(form.units) : nav && nav > 0 ? amount / nav : null;

    const { error } = await supabase.from("investment_transactions").insert({
      user_id: user.id,
      investment_plan_id: form.investmentPlanId || null,
      transaction_type: form.transactionType,
      amount,
      nav,
      units,
      transaction_date: form.transactionDate,
      status: form.status,
      notes: form.notes || null,
    });

    setMessage(error ? error.message : "Transaction saved.");
    if (!error) {
      setForm((current) => ({ ...current, amount: "", nav: "", units: "", notes: "" }));
      void loadData();
    }
  }

  const gainSummary = useMemo(() => summarizeCapitalGains(buildCapitalGainLots(transactions)), [transactions]);

  return (
    <section className="space-y-6">
      <PageHero eyebrow="Transactions" title="Record and review portfolio actions" description="Buys, sells, and switches now sit inside dedicated WealthWise form and ledger sections." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Transactions" value={String(transactions.length)} />
        <MetricTile label="STCG" value={formatCurrency(gainSummary.stcg)} />
        <MetricTile label="LTCG" value={formatCurrency(gainSummary.ltcg)} />
      </div>
      <SurfacePanel title="Add transaction" subtitle="Record buys, sells, and switches with FIFO-ready details.">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <SelectField label="Investment" value={form.investmentPlanId} options={[{ value: "", label: "Standalone transaction" }, ...investments.map((item) => ({ value: item.id, label: item.fund_name }))]} onChange={(value) => setForm((current) => ({ ...current, investmentPlanId: value }))} />
          <SelectField label="Type" value={form.transactionType} options={[{ value: "BUY", label: "BUY" }, { value: "SELL", label: "SELL" }, { value: "SWITCH", label: "SWITCH" }]} onChange={(value) => setForm((current) => ({ ...current, transactionType: value }))} />
          <SelectField label="Status" value={form.status} options={[{ value: "Completed", label: "Completed" }, { value: "Scheduled", label: "Scheduled" }, { value: "Pending", label: "Pending" }]} onChange={(value) => setForm((current) => ({ ...current, status: value }))} />
          <Field label="Amount" type="number" value={form.amount} onChange={(value) => setForm((current) => ({ ...current, amount: value }))} />
          <Field label="NAV" type="number" value={form.nav} onChange={(value) => setForm((current) => ({ ...current, nav: value }))} />
          <Field label="Units" type="number" value={form.units} onChange={(value) => setForm((current) => ({ ...current, units: value }))} />
          <Field label="Transaction date" type="date" value={form.transactionDate} onChange={(value) => setForm((current) => ({ ...current, transactionDate: value }))} />
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-white/72">Notes</label><input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="ww-auth-input" /></div>
          <div className="md:col-span-3 flex items-center gap-3"><button type="submit" className="rounded-full bg-[#b4ff45] px-5 py-3 text-sm font-semibold text-[#062415]">Save transaction</button>{message ? <EmptyNotice message={message} tone="success" /> : null}</div>
        </form>
      </SurfacePanel>
      <SurfacePanel title="Transaction log" subtitle="Every transaction contributes to reporting and tax calculation.">
        <div className="space-y-4">
          {transactions.length === 0 ? <EmptyNotice message="No transactions recorded yet." /> : null}
          {transactions.map((item) => <div key={item.id} className="grid gap-3 rounded-[26px] border border-white/8 bg-[#071510] p-5 md:grid-cols-6"><DataPill label="Type" value={item.transaction_type} /><DataPill label="Amount" value={formatCurrency(item.amount)} /><DataPill label="NAV" value={item.nav ? item.nav.toFixed(4) : "-"} /><DataPill label="Units" value={item.units ? item.units.toFixed(4) : "-"} /><DataPill label="Date" value={formatDate(item.transaction_date)} /><DataPill label="Status" value={item.status} /></div>)}
        </div>
      </SurfacePanel>
    </section>
  );
}

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void; }) { return <div><label className="mb-2 block text-sm font-medium text-white/72">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="ww-auth-input" /></div>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; }) { return <div><label className="mb-2 block text-sm font-medium text-white/72">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="ww-auth-input">{options.map((option) => <option key={option.value || option.label} value={option.value}>{option.label}</option>)}</select></div>; }
