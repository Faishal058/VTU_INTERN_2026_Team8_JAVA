"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ImportInvestmentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  function downloadTemplate() {
    const csv = "fund_name,scheme_code,amc,category,goal_id,investment_mode,amount,nav,frequency,start_date,note,risk_profile\nParag Parikh Flexi Cap Fund,122639,PPFAS,Flexi Cap,,SIP,8000,75.23,Monthly,2026-04-01,Long term core fund,Moderate";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "investment-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    const text = await file.text();
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(",").map((item) => item.trim());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const plans = [];
    const txns = [];
    for (const line of lines) {
      const values = line.split(",");
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
      plans.push({
        user_id: user.id,
        fund_name: row.fund_name,
        scheme_code: row.scheme_code || null,
        amc: row.amc,
        category: row.category,
        goal_id: row.goal_id || null,
        investment_mode: row.investment_mode,
        amount: Number(row.amount),
        frequency: row.frequency,
        start_date: row.start_date || null,
        note: row.note || null,
        risk_profile: row.risk_profile || "Moderate",
      });
      txns.push({
        user_id: user.id,
        transaction_type: "BUY",
        amount: Number(row.amount),
        nav: row.nav ? Number(row.nav) : null,
        units: row.nav ? Number(row.amount) / Number(row.nav) : null,
        transaction_date: row.start_date || new Date().toISOString().slice(0, 10),
        status: row.investment_mode === "SIP" ? "Scheduled" : "Completed",
        notes: row.note || null,
      });
    }

    const { data, error } = await supabase.from("investment_plans").insert(plans).select("id");
    if (error) {
      setMessage(error.message);
      return;
    }

    const txnsWithIds = txns.map((txn, index) => ({ ...txn, investment_plan_id: data?.[index]?.id ?? null }));
    await supabase.from("investment_transactions").insert(txnsWithIds);
    setMessage(`Imported ${plans.length} investments successfully.`);
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-700">Bulk import</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Import investments from CSV</h1>
      </header>
      <div className="rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.06)] space-y-4">
        <button onClick={downloadTemplate} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Download template</button>
        <input type="file" accept=".csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); }} className="block w-full text-sm text-slate-700" />
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        <button onClick={() => router.push("/dashboard/investments")} className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Back to investments</button>
      </div>
    </section>
  );
}
