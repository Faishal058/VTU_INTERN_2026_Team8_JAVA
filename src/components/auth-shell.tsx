import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  eyebrow: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, eyebrow, children, footer }: AuthShellProps) {
  return (
    <main className="ww-auth-shell min-h-screen overflow-hidden bg-[#04140f] text-white">
      <div className="ww-home__aurora" aria-hidden="true" />
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-5 py-6 sm:px-8 lg:grid-cols-[0.92fr,1.08fr] lg:px-10">
        <section className="relative flex flex-col justify-between rounded-[36px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b4ff45] text-sm font-black tracking-[0.18em] text-[#062415]">
                WW
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white">WealthWise</p>
                <p className="text-xs text-white/55">Invest with clarity</p>
              </div>
            </Link>

            <div className="mt-16 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b4ff45]">{eyebrow}</p>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-white/65">{description}</p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[26px] border border-white/10 bg-white/6 p-5">
                <p className="text-2xl font-semibold">24</p>
                <p className="mt-2 text-sm text-white/55">Active SIP plans</p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/6 p-5">
                <p className="text-2xl font-semibold">8 goals</p>
                <p className="mt-2 text-sm text-white/55">Mapped to outcomes</p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/6 p-5">
                <p className="text-2xl font-semibold">+14.2%</p>
                <p className="mt-2 text-sm text-white/55">Illustrative growth</p>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[32px] border border-white/10 bg-[#071510] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">Platform pulse</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-[20px] bg-white/6 px-4 py-3 text-sm text-white/75">Goal-linked planning and investment tracking</div>
              <div className="rounded-[20px] bg-white/6 px-4 py-3 text-sm text-white/75">Alerts, analytics, tax summaries, and reports</div>
              <div className="rounded-[20px] bg-white/6 px-4 py-3 text-sm text-white/75">One consistent WealthWise decision surface</div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center py-6 lg:py-10">
          <div className="ww-auth-card w-full max-w-xl rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:p-8">
            {children}
            {footer ? <div className="mt-8">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
