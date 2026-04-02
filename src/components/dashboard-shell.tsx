"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/investments", label: "Investments" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/market", label: "Market" },
  { href: "/dashboard/tax", label: "Tax" },
  { href: "/dashboard/notifications", label: "Alerts" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
];

type DashboardShellProps = {
  children: ReactNode;
  userLabel: string;
};

export function DashboardShell({ children, userLabel }: DashboardShellProps) {
  const pathname = usePathname();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      const { count } = await supabase
        .from("user_alerts")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      setUnreadAlerts(count ?? 0);
    }

    void loadUnreadCount();
  }, []);

  return (
    <div className="ww-app-shell min-h-screen bg-[#04140f] text-white">
      <div className="ww-home__aurora" aria-hidden="true" />
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:gap-6 xl:px-8">
        <aside className="rounded-[30px] border border-white/10 bg-white/6 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:w-80 xl:shrink-0">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b4ff45] text-sm font-black tracking-[0.18em] text-[#062415]">
              WW
            </div>
            <div>
              <p className="font-semibold text-white">WealthWise</p>
              <p className="text-sm text-white/48">Smart mutual fund cockpit</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const isAlerts = item.href === "/dashboard/notifications";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[#b4ff45] text-[#062415] shadow-[0_16px_40px_rgba(180,255,69,0.22)]"
                      : "text-white/68 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {isAlerts && unreadAlerts > 0 ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        active ? "bg-[#062415]/10 text-[#062415]" : "bg-rose-400/18 text-rose-200"
                      }`}
                    >
                      {unreadAlerts}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[30px] border border-white/10 bg-[#071510] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-white/42">Signed in as</p>
            <p className="mt-2 text-lg font-semibold text-white">{userLabel}</p>
            <p className="mt-4 text-sm leading-6 text-white/55">
              Track SIPs, review goals, and act on allocation changes from one place.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-6">{children}</main>
      </div>
    </div>
  );
}
