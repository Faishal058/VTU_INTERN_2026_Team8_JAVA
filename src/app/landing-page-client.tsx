"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const trustMetrics = [
  { label: "Tracked AUM", value: "Rs 128Cr+" },
  { label: "Investor goals mapped", value: "42K" },
  { label: "Average monthly SIP", value: "Rs 18,400" },
  { label: "Alert response time", value: "< 5 min" },
];

const platformFeatures = [
  {
    title: "See your whole money system",
    description:
      "Bring portfolio value, active SIPs, upcoming alerts, and goal progress into one clear operating view.",
    points: ["Live dashboard summaries", "Goal-linked investments", "Transaction and tax visibility"],
  },
  {
    title: "Move from guesswork to planning",
    description:
      "Model monthly contributions, inflation, return expectations, and timeline tradeoffs before you commit capital.",
    points: ["Inflation-aware goal planning", "SIP simulations", "Scenario-based contribution planning"],
  },
  {
    title: "Act while the market is moving",
    description:
      "Use market snapshots, fund search, and alert workflows to stay on top of opportunities instead of reacting late.",
    points: ["Fund master sync", "Market pulse cards", "Unread alert workflows"],
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Connect your investing routine",
    text: "Create investments, import CSV history, and map every plan to a real-life goal.",
  },
  {
    step: "02",
    title: "Track progress automatically",
    text: "Watch growth, monthly needs, and milestone alerts update from one dashboard shell.",
  },
  {
    step: "03",
    title: "Decide with confidence",
    text: "Review analytics, compare snapshots, and export reports when it is time to act.",
  },
];

const stickyPanels = [
  {
    eyebrow: "Overview",
    title: "A dashboard that never loses the thread.",
    body: "Portfolio value, SIP rhythm, goal readiness, and alerts all stay visually connected while you scroll through the product story.",
    metric: "18.42L tracked",
  },
  {
    eyebrow: "Planning",
    title: "Goals turn into measurable monthly decisions.",
    body: "Inflation-aware planning and contribution targets help you see how each investment plan pushes a real outcome forward.",
    metric: "81% retirement readiness",
  },
  {
    eyebrow: "Action",
    title: "Alerts and analytics stay ready when timing matters.",
    body: "Unread prompts, market pulse changes, and tax signals show up in one focused decision surface instead of scattered screens.",
    metric: "03 urgent prompts",
  },
];

const showcaseCards = [
  {
    badge: "Goal heatmap",
    title: "College fund is 62% funded",
    subtitle: "Monthly gap down by Rs 4,200 after your latest SIP increase.",
  },
  {
    badge: "Market pulse",
    title: "NIFTY closed higher today",
    subtitle: "Your diversified plans stayed ahead of inflation assumptions.",
  },
  {
    badge: "Tax watch",
    title: "Capital gains split is ready",
    subtitle: "FIFO lots and summary exports are prepared before filing season.",
  },
];

export function LandingPageClient() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main ref={rootRef} className="ww-home bg-[#04140f] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="ww-home__aurora" aria-hidden="true" />
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-16 pt-6 sm:px-8 lg:px-10">
          <header className="relative z-10 flex items-center justify-between rounded-full border border-white/12 bg-white/6 px-5 py-3 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b4ff45] text-sm font-black tracking-[0.18em] text-[#062415]">WW</div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/95">WealthWise</p>
                <p className="text-xs text-white/55">Invest with clarity</p>
              </div>
            </Link>
            <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <a href="#platform" className="transition hover:text-white">Platform</a>
              <a href="#workflow" className="transition hover:text-white">How it works</a>
              <a href="#analytics" className="transition hover:text-white">Analytics</a>
              <a href="#faq" className="transition hover:text-white">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/35 hover:bg-white/8">Sign in</Link>
              <Link href="/signup" className="rounded-full bg-[#b4ff45] px-5 py-2 text-sm font-semibold text-[#062415] transition hover:bg-[#c6ff74]">Start free</Link>
            </div>
          </header>

          <div className="relative z-10 grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.02fr,0.98fr] lg:py-20">
            <section className="max-w-3xl" data-reveal>
              <p className="inline-flex rounded-full border border-[#b4ff45]/30 bg-[#b4ff45]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#d4ff97]">
                Personal finance cockpit
              </p>
              <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.05em] text-white sm:text-6xl lg:text-8xl">
                Investing that feels clear, fast, and completely in your control.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/68 sm:text-xl">
                WealthWise helps you build mutual fund plans, connect them to real goals, track progress live, and act from one elegant dashboard.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/signup" className="rounded-full bg-[#b4ff45] px-7 py-4 text-base font-semibold text-[#062415] transition hover:bg-[#c6ff74]">Get started</Link>
                <Link href="/login" className="rounded-full border border-white/15 px-7 py-4 text-base font-semibold text-white/90 transition hover:border-white/35 hover:bg-white/8">View dashboard access</Link>
              </div>
              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <MetricCard value="Rs 12.8L" label="Live portfolio view" />
                <MetricCard value="8 goals" label="Mapped to actual plans" />
                <MetricCard value="+14.2%" label="Illustrative annual growth" />
              </div>
            </section>

            <section className="relative" data-reveal>
              <div className="ww-home__grid" aria-hidden="true" />
              <div className="ww-home__hero-grid rounded-[36px] border border-white/8 bg-[rgba(6,27,20,0.55)] p-6 backdrop-blur-xl">
                <div className="ww-home__hero-stack">
                  <div className="ww-home__hero-card ww-home__float-two">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-white/45">SIP velocity</p>
                        <h2 className="mt-3 text-2xl font-semibold">Rs 23,500 / month</h2>
                      </div>
                      <div className="rounded-full bg-[#b4ff45]/18 px-3 py-1 text-xs font-semibold text-[#d8ff9a]">+12.6%</div>
                    </div>
                    <AnimatedBars />
                  </div>
                  <div className="ww-home__hero-card">
                    <p className="text-xs uppercase tracking-[0.32em] text-white/45">Today</p>
                    <div className="mt-4 space-y-4">
                      <PulseItem title="Top up suggested" value="Large cap SIP due tomorrow" />
                      <PulseItem title="Goal milestone" value="Education fund crossed 60%" />
                      <PulseItem title="Market snapshot" value="NIFTY closed +0.84%" />
                    </div>
                  </div>
                </div>
                <div className="ww-home__hero-phone ww-home__float-one">
                  <div className="ww-home__phone-top">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <span className="text-xs uppercase tracking-[0.35em] text-white/45">Goal sync</span>
                  </div>
                  <div className="mt-6">
                    <p className="text-sm text-white/55">Total portfolio</p>
                    <p className="mt-2 text-5xl font-semibold tracking-[-0.05em]">Rs 18.42L</p>
                    <p className="mt-3 text-sm text-[#b4ff45]">+Rs 1.92L this year</p>
                  </div>
                  <AnimatedLineChart />
                  <div className="mt-8 grid gap-3">
                    <InsightRow title="Retirement 2045" value="81% on track" accent="bg-[#b4ff45]" />
                    <InsightRow title="Home down payment" value="Needs Rs 9,000/mo" accent="bg-cyan-400" />
                    <InsightRow title="Tax summary" value="Updated today" accent="bg-fuchsia-400" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-white/10 bg-[#061b14] py-5">
        <div className="ww-home__ticker">
          {[...trustMetrics, ...trustMetrics].map((item, index) => (
            <div key={`${item.label}-${index}`} className="ww-home__ticker-item">
              <span className="text-white/42">{item.label}</span>
              <strong className="ml-3 text-xl font-semibold text-white">{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
        <div className="max-w-2xl" data-reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b4ff45]">Platform</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">One investing surface for planning, execution, and review.</h2>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {platformFeatures.map((feature, index) => (
            <article key={feature.title} className="ww-home__panel" data-reveal style={{ transitionDelay: `${index * 120}ms` }}>
              <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5" />
              <h3 className="mt-8 text-2xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-4 text-base leading-7 text-white/65">{feature.description}</p>
              <div className="mt-8 space-y-3">
                {feature.points.map((point) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-white/78">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b4ff45]" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-y border-white/10 bg-[#071e17]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="grid gap-12 xl:grid-cols-[0.85fr,1.15fr]">
            <div className="xl:sticky xl:top-24 xl:self-start" data-reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b4ff45]">How it works</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Built to move from intention to action without friction.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">Whether you are organizing your first SIP or coordinating multiple long-term goals, WealthWise keeps the next move obvious.</p>
              <div className="ww-home__sticky-device mt-10 hidden xl:block">
                <StickyPhoneVisual />
              </div>
            </div>
            <div className="space-y-5">
              {workflowSteps.map((item, index) => (
                <div key={item.step} className="ww-home__timeline-card" data-reveal style={{ transitionDelay: `${index * 120}ms` }}>
                  <div className="ww-home__timeline-step">{item.step}</div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-base leading-7 text-white/65">{item.text}</p>
                  </div>
                </div>
              ))}
              <div className="xl:hidden" data-reveal>
                <StickyPhoneVisual />
              </div>
              <div className="grid gap-5 pt-6">
                {stickyPanels.map((panel, index) => (
                  <article key={panel.title} className="ww-home__story-panel" data-reveal style={{ transitionDelay: `${index * 120}ms` }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d4ff97]">{panel.eyebrow}</p>
                    <h3 className="mt-4 text-3xl font-semibold text-white">{panel.title}</h3>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">{panel.body}</p>
                    <div className="mt-6 inline-flex rounded-full border border-[#b4ff45]/20 bg-[#b4ff45]/10 px-4 py-2 text-sm font-semibold text-[#d8ff9a]">{panel.metric}</div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="analytics" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
          <div className="ww-home__analytics-frame" data-reveal>
            <div className="ww-home__analytics-header">
              <div>
                <p className="text-sm text-white/45">Analytics canvas</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">Measure what matters</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/72">Updated live</div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
              <div className="rounded-[28px] border border-white/8 bg-[#081611] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/45">Growth projection</p>
                  <p className="text-sm text-[#b4ff45]">+18.4%</p>
                </div>
                <AnimatedAreaChart />
              </div>
              <div className="space-y-4">
                {showcaseCards.map((card, index) => (
                  <div key={card.title} className="rounded-[24px] border border-white/8 bg-white/5 p-5" data-reveal style={{ transitionDelay: `${index * 120}ms` }}>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">{card.badge}</p>
                    <h4 className="mt-3 text-xl font-semibold text-white">{card.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-white/62">{card.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div data-reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b4ff45]">Analytics</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Turn scattered numbers into one confident decision surface.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">Review fund behavior, goal readiness, alert backlog, and tax posture inside one system designed to feel calm under pressure.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <StatPanel label="Active SIP plans" value="24" />
              <StatPanel label="Goal completion rate" value="78%" />
              <StatPanel label="Unread action alerts" value="03" />
              <StatPanel label="Export-ready reports" value="12" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[radial-gradient(circle_at_top,rgba(180,255,69,0.10),transparent_38%),#081711]">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8" data-reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b4ff45]">Ready to begin</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">Build your WealthWise workspace and make your next move with context.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">Sign in to your dashboard, start a new plan, import history, and let your goals drive the rest of the workflow.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className="rounded-full bg-[#b4ff45] px-7 py-4 text-base font-semibold text-[#062415] transition hover:bg-[#c6ff74]">Create your account</Link>
            <a href="#faq" className="rounded-full border border-white/15 px-7 py-4 text-base font-semibold text-white/88 transition hover:border-white/35 hover:bg-white/8">Read FAQs</a>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          <FaqCard question="What does WealthWise help me do?" answer="It combines portfolio tracking, goal planning, market snapshots, alerts, reports, and tax visibility in one connected workflow." />
          <FaqCard question="Can I use it for mutual fund planning?" answer="Yes. The current product flow is built around investment plans, SIP tracking, goal mapping, fund lookup, and performance-oriented review." />
          <FaqCard question="Does it support action-oriented alerts?" answer="Yes. The dashboard includes alert generation for goals, investment activity, and unread status tracking inside the shell." />
          <FaqCard question="How do I get started?" answer="Create an account, add your first investment plan or import transactions, then connect those plans to your financial goals." />
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#06120e]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 text-sm text-white/55 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="text-base font-semibold text-white">WealthWise</p>
            <p className="mt-2 max-w-md">A modern investing workspace for mutual fund planning, analytics, alerts, and long-term goal execution.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-white/70">
            <Link href="/login" className="transition hover:text-white">Login</Link>
            <Link href="/signup" className="transition hover:text-white">Signup</Link>
            <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function AnimatedLineChart() {
  return (
    <div className="ww-home__chart mt-8">
      <svg viewBox="0 0 420 170" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="heroLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(180,255,69,0.95)" />
            <stop offset="100%" stopColor="rgba(180,255,69,0.1)" />
          </linearGradient>
          <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(180,255,69,0.28)" />
            <stop offset="100%" stopColor="rgba(180,255,69,0)" />
          </linearGradient>
        </defs>
        <path d="M10 150 C55 142 72 138 105 110 C132 88 160 94 190 76 C218 58 252 24 284 40 C314 56 336 28 410 14" stroke="url(#heroLine)" strokeWidth="5" strokeLinecap="round" className="ww-home__svg-path" />
        <path d="M10 150 C55 142 72 138 105 110 C132 88 160 94 190 76 C218 58 252 24 284 40 C314 56 336 28 410 14 L410 170 L10 170 Z" fill="url(#heroArea)" className="ww-home__svg-area" />
        <circle cx="284" cy="40" r="6" fill="#d7ff96" className="ww-home__chart-dot" />
        <circle cx="410" cy="14" r="5" fill="#d7ff96" className="ww-home__chart-dot ww-home__chart-dot--late" />
      </svg>
    </div>
  );
}

function AnimatedBars() {
  return (
    <div className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,rgba(180,255,69,0.16),rgba(180,255,69,0.02))] p-3">
      <svg viewBox="0 0 300 96" className="h-24 w-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7ff96" />
            <stop offset="100%" stopColor="#54d8a1" />
          </linearGradient>
        </defs>
        {[36, 58, 48, 74, 64, 88].map((height, index) => {
          const x = 14 + index * 46;
          const y = 94 - height;
          return <rect key={x} x={x} y={y} width="28" height={height} rx="14" className="ww-home__svg-bar" style={{ animationDelay: `${index * 0.14}s` }} />;
        })}
      </svg>
    </div>
  );
}

function AnimatedAreaChart() {
  return (
    <div className="mt-6 overflow-hidden rounded-[26px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(180,255,69,0.10),transparent_38%),#091712] p-4">
      <svg viewBox="0 0 520 240" className="h-[220px] w-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(180,255,69,0.26)" />
            <stop offset="100%" stopColor="rgba(180,255,69,0)" />
          </linearGradient>
          <linearGradient id="analyticsLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7dfab4" />
            <stop offset="100%" stopColor="#d7ff96" />
          </linearGradient>
        </defs>
        <g className="ww-home__svg-grid">
          {[30, 78, 126, 174, 222].map((y) => <line key={y} x1="0" y1={y} x2="520" y2={y} />)}
          {[40, 120, 200, 280, 360, 440].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="240" />)}
        </g>
        <path d="M0 190 C60 174 92 182 130 150 C174 116 208 118 248 96 C294 70 326 90 368 62 C410 34 448 46 520 16 L520 240 L0 240 Z" fill="url(#analyticsArea)" className="ww-home__svg-area" />
        <path d="M0 190 C60 174 92 182 130 150 C174 116 208 118 248 96 C294 70 326 90 368 62 C410 34 448 46 520 16" stroke="url(#analyticsLine)" strokeWidth="6" strokeLinecap="round" className="ww-home__svg-path" />
      </svg>
    </div>
  );
}

function StickyPhoneVisual() {
  return (
    <div className="ww-home__hero-phone">
      <div className="ww-home__phone-top">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="text-xs uppercase tracking-[0.35em] text-white/45">Live dashboard</span>
      </div>
      <div className="mt-6 grid gap-4">
        <div className="rounded-[26px] border border-white/8 bg-white/6 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">Portfolio</p>
          <p className="mt-3 text-3xl font-semibold">Rs 18.42L</p>
          <p className="mt-2 text-sm text-[#b4ff45]">Goal-linked growth view</p>
        </div>
        <div className="rounded-[26px] border border-white/8 bg-white/6 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">Alerts</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[18px] bg-[#071510] px-3 py-3 text-sm text-white/72">SIP due in 1 day</div>
            <div className="rounded-[18px] bg-[#071510] px-3 py-3 text-sm text-white/72">Goal milestone crossed</div>
            <div className="rounded-[18px] bg-[#071510] px-3 py-3 text-sm text-white/72">Tax report ready</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl"><p className="text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p><p className="mt-2 text-sm text-white/56">{label}</p></div>;
}

function InsightRow({ title, value, accent }: { title: string; value: string; accent: string }) {
  return <div className="flex items-center justify-between rounded-[22px] border border-white/8 bg-white/6 px-4 py-3"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${accent}`} /><span className="text-sm text-white/72">{title}</span></div><span className="text-sm font-medium text-white">{value}</span></div>;
}

function PulseItem({ title, value }: { title: string; value: string }) {
  return <div className="rounded-[22px] border border-white/8 bg-[#071510] px-4 py-3"><p className="text-sm font-medium text-white">{title}</p><p className="mt-1 text-sm text-white/52">{value}</p></div>;
}

function StatPanel({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[24px] border border-white/10 bg-white/5 p-5"><p className="text-sm text-white/45">{label}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p></div>;
}

function FaqCard({ question, answer }: { question: string; answer: string }) {
  return <article className="rounded-[30px] border border-white/10 bg-white/5 p-7" data-reveal><h3 className="text-2xl font-semibold text-white">{question}</h3><p className="mt-4 text-base leading-7 text-white/65">{answer}</p></article>;
}
