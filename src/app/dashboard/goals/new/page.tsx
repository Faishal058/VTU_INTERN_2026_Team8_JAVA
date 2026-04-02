"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { calculateMonthlyNeed } from "@/lib/planning";
import { EmptyNotice, GhostButton, PageHero, SurfacePanel } from "@/components/dashboard-surface";

export default function NewGoalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ goalName: "", category: "Retirement", targetAmount: "", targetDate: "", investedAmount: "", priority: "Important", expectedReturn: "12", inflationRate: "6" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in again before saving a goal.");
      setSubmitting(false);
      return;
    }
    const targetAmount = Number(form.targetAmount);
    const investedAmount = Number(form.investedAmount || 0);
    const expectedReturn = Number(form.expectedReturn || 0);
    const inflationRate = Number(form.inflationRate || 6);
    if (!form.goalName || !form.targetDate || !targetAmount) {
      setError("Goal name, target amount, and target date are required.");
      setSubmitting(false);
      return;
    }
    const inflatedTarget = targetAmount * Math.pow(1 + inflationRate / 100, Math.max(new Date(form.targetDate).getFullYear() - new Date().getFullYear(), 0));
    const monthlyNeed = calculateMonthlyNeed(inflatedTarget, investedAmount, form.targetDate, expectedReturn);
    const { data, error } = await supabase.from("financial_goals").insert({ user_id: user.id, name: form.goalName, category: form.category, target_amount: targetAmount, invested_amount: investedAmount, target_date: form.targetDate, priority: form.priority, expected_return: expectedReturn, inflation_rate: inflationRate, monthly_need: monthlyNeed, status: "Active" }).select("id").single();
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    await supabase.from("user_alerts").insert({ user_id: user.id, title: "Goal created", description: `${form.goalName} was added under ${form.category}. Suggested monthly contribution is Rs ${Math.round(monthlyNeed).toLocaleString("en-IN")}.`, severity: monthlyNeed > 20000 ? "Action" : "Info", source_type: "financial_goal", source_id: data.id });
    setSubmitting(false);
    router.push("/dashboard/goals");
  }

  return (
    <section className="space-y-6">
      <PageHero eyebrow="New goal" title="Define a goal and the contribution pace needed" description="Goal creation now uses the same curated WealthWise surface language as the landing page and core dashboard." />
      <SurfacePanel title="Goal details" subtitle="Set the target, horizon, assumptions, and priority for this outcome.">
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <Field label="Goal name" value={form.goalName} onChange={(value) => setForm((current) => ({ ...current, goalName: value }))} />
          <SelectField label="Category" value={form.category} options={["Retirement", "Education", "House", "Car", "Emergency", "Custom"]} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
          <Field label="Target amount" type="number" value={form.targetAmount} onChange={(value) => setForm((current) => ({ ...current, targetAmount: value }))} />
          <Field label="Target date" type="date" value={form.targetDate} onChange={(value) => setForm((current) => ({ ...current, targetDate: value }))} />
          <Field label="Current invested amount" type="number" value={form.investedAmount} onChange={(value) => setForm((current) => ({ ...current, investedAmount: value }))} />
          <SelectField label="Priority" value={form.priority} options={["Essential", "Important", "Aspirational"]} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} />
          <Field label="Expected annual return (%)" type="number" value={form.expectedReturn} onChange={(value) => setForm((current) => ({ ...current, expectedReturn: value }))} />
          <Field label="Inflation rate (%)" type="number" value={form.inflationRate} onChange={(value) => setForm((current) => ({ ...current, inflationRate: value }))} />
          <div className="lg:col-span-2 flex flex-wrap gap-3"><button type="submit" disabled={submitting} className="rounded-full bg-[#b4ff45] px-5 py-3 text-sm font-semibold text-[#062415] transition hover:bg-[#c6ff74]">{submitting ? "Saving..." : "Save goal"}</button><GhostButton type="button" onClick={() => router.push("/dashboard/goals")}>Back to goals</GhostButton></div>
          {error ? <div className="lg:col-span-2"><EmptyNotice message={error} tone="error" /></div> : null}
        </form>
      </SurfacePanel>
    </section>
  );
}

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void; }) { return <div><label className="mb-2 block text-sm font-medium text-white/72">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="ww-auth-input" /></div>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void; }) { return <div><label className="mb-2 block text-sm font-medium text-white/72">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="ww-auth-input">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>; }
