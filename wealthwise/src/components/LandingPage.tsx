"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── Tiny hook: detect if element is in viewport ──────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

// ── Fund search (queries mutual_funds table via public API) ───────
const SAMPLE_FUNDS = [
  "Parag Parikh Flexi Cap Fund",
  "Mirae Asset Large Cap Fund",
  "HDFC Mid-Cap Opportunities Fund",
  "Axis Bluechip Fund",
  "SBI Small Cap Fund",
  "Kotak Emerging Equity Fund",
  "ICICI Prudential Equity & Debt Fund",
  "Nippon India Small Cap Fund",
  "UTI Nifty 50 Index Fund",
  "Aditya Birla Sun Life Liquid Fund",
];

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Navbar shadow on scroll
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fund search filter (client-side demo, replace with Supabase query)
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setResults(
      SAMPLE_FUNDS.filter(f => f.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    );
  }, [query]);

  // Scroll sections
  const featuresRef = useRef<HTMLElement | null>(null);
  const howRef = useRef<HTMLElement | null>(null);
  const scrollTo = (ref: React.RefObject<HTMLElement | null>) =>
    ref.current?.scrollIntoView({ behavior: "smooth" });

  const features = useInView();
  const how = useInView();
  const search = useInView();

  return (
    <>
      {/* ── Fonts & global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #020817; color: #e2e8f0; font-family: 'DM Sans', sans-serif; }

        .syne { font-family: 'Syne', sans-serif; }

        /* Mesh background */
        .mesh {
          background:
            radial-gradient(ellipse 90% 60% at 15% 0%,   rgba(139,92,246,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 85% 15%,  rgba(236,72,153,0.16) 0%, transparent 55%),
            radial-gradient(ellipse 70% 40% at 50% 80%,  rgba(251,191,36,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 10% 80%,  rgba(20,184,166,0.10) 0%, transparent 55%),
            #020817;
        }

        /* Grain overlay */
        .mesh::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.35;
        }

        /* Glass card */
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(14px);
        }
        .glass-hover {
          transition: border-color 0.2s, transform 0.2s, background 0.2s;
        }
        .glass-hover:hover {
          border-color: rgba(139,92,246,0.4);
          background: rgba(139,92,246,0.07);
          transform: translateY(-3px);
        }

        /* Gradient text */
        .grad-text {
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #fb923c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Pill badge */
        .pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.35);
          color: #c4b5fd;
          padding: 4px 14px; border-radius: 100px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex; align-items: center; gap-8px;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          color: white; font-weight: 600; font-size: 15px;
          padding: 13px 28px; border-radius: 14px; border: none; cursor: pointer;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 30px rgba(139,92,246,0.35);
          text-decoration: none;
        }
        .btn-primary:hover {
          opacity: 0.92; transform: translateY(-2px);
          box-shadow: 0 0 45px rgba(139,92,246,0.5);
        }
        .btn-secondary {
          display: inline-flex; align-items: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          color: #cbd5e1; font-weight: 500; font-size: 15px;
          padding: 13px 28px; border-radius: 14px; cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          text-decoration: none;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }

        /* Scroll-reveal */
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal.d1 { transition-delay: 0.05s; }
        .reveal.d2 { transition-delay: 0.12s; }
        .reveal.d3 { transition-delay: 0.19s; }
        .reveal.d4 { transition-delay: 0.26s; }

        /* Hero float animation */
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .float { animation: floatY 5s ease-in-out infinite; }

        /* Pulse dot */
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }

        /* Nav */
        .nav-glass {
          background: rgba(2,8,23,0.75);
          backdrop-filter: blur(18px);
          transition: box-shadow 0.3s;
        }
        .nav-scrolled { box-shadow: 0 1px 0 rgba(255,255,255,0.08); }

        /* Step connector line */
        .step-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(139,92,246,0.6), rgba(236,72,153,0.6));
        }

        /* Search dropdown */
        .dropdown {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0;
          background: #0f172a; border: 1px solid rgba(139,92,246,0.3);
          border-radius: 14px; overflow: hidden; z-index: 50;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .dropdown-item {
          padding: 12px 18px; cursor: pointer; font-size: 14px; color: #cbd5e1;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dropdown-item:last-child { border-bottom: none; }
        .dropdown-item:hover { background: rgba(139,92,246,0.15); color: white; }

        /* Stat cards */
        .stat-glow { box-shadow: 0 0 40px rgba(139,92,246,0.12); }

        /* Mobile menu */
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .mobile-menu { animation: slideDown 0.2s ease; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
      `}</style>

      <div className="mesh min-h-screen relative">

        {/* ── NAVBAR ── */}
        <nav className={`nav-glass fixed top-0 left-0 right-0 z-50 px-6 py-4 ${navScrolled ? "nav-scrolled" : ""}`}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg,#7c3aed,#db2777)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
              }}>💰</div>
              <span className="syne" style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>WealthWise</span>
            </div>

            {/* Desktop nav links */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="desktop-nav">
              <button onClick={() => scrollTo(featuresRef)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "6px 14px", borderRadius: 8, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e2e8f0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
                Features
              </button>
              <button onClick={() => scrollTo(howRef)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "6px 14px", borderRadius: 8, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e2e8f0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
                How it works
              </button>
              <button onClick={() => scrollTo(search.ref as any)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "6px 14px", borderRadius: 8, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e2e8f0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
                Fund Search
              </button>
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/login" className="btn-secondary" style={{ padding: "9px 20px", fontSize: 14 }}>Login</Link>
              <Link href="/signup" className="btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>Register</Link>
            </div>

          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", zIndex: 1 }}>

          {/* Decorative orbs */}
          <div style={{ position: "absolute", top: "15%", left: "8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "6%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Badge */}
          <div className="pill" style={{ marginBottom: 28, animation: "floatY 4s ease-in-out infinite" }}>
            <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
            Built for Indian Investors · Free Forever
          </div>

          {/* Headline */}
          <h1 className="syne" style={{ fontSize: "clamp(38px, 7vw, 76px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 820, marginBottom: 24 }}>
            Your Portfolio.{" "}
            <span className="grad-text">Unified.</span>
            <br />
            Intelligence{" "}
            <span className="grad-text">Delivered.</span>
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "#94a3b8", maxWidth: 560, lineHeight: 1.65, marginBottom: 40, fontWeight: 400 }}>
            Track every SIP and lump-sum investment in one place. Real-time NAV, XIRR calculations, goal tracking — all completely free for retail investors.
          </p>

          {/* CTA row */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 60 }}>
            <Link href="/signup" className="btn-primary" style={{ fontSize: 16, padding: "15px 32px" }}>
              Register Now (Get Started) →
            </Link>
            <Link href="/login" className="btn-secondary" style={{ fontSize: 16, padding: "15px 32px" }}>
              Login (Access Account)
            </Link>
          </div>

          {/* Hero visual — mini dashboard mockup */}
          <div className="float glass" style={{
            borderRadius: 20, padding: "20px 24px", maxWidth: 580, width: "100%",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.12)"
          }}>
            {/* Mock header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span className="syne" style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>Portfolio Overview</span>
              <span style={{ fontSize: 11, color: "#475569", background: "rgba(71,85,105,0.2)", padding: "3px 10px", borderRadius: 6 }}>Live · NAV Updated</span>
            </div>
            {/* Mock KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Current Value", val: "₹6.25 L", color: "#a78bfa" },
                { label: "Invested", val: "₹5.00 L", color: "#2dd4bf" },
                { label: "Total Gain", val: "+25.0%", color: "#4ade80" },
              ].map(k => (
                <div key={k.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: 10, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</p>
                  <p className="syne" style={{ fontSize: 16, fontWeight: 700, color: k.color }}>{k.val}</p>
                </div>
              ))}
            </div>
            {/* Mock bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Equity", pct: 70, color: "#8b5cf6" },
                { label: "Debt", pct: 20, color: "#60a5fa" },
                { label: "Hybrid", pct: 10, color: "#f59e0b" },
              ].map(b => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#64748b", width: 44 }}>{b.label}</span>
                  <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${b.pct}%`, background: b.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#475569", width: 30, textAlign: "right" }}>{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <p style={{ marginTop: 36, fontSize: 13, color: "#475569" }}>
            Built on <span style={{ color: "#c4b5fd" }}>Supabase</span> · Data from <span style={{ color: "#c4b5fd" }}>AMFI India</span> · Zero cost to investors
          </p>
        </section>

        {/* ── FEATURE HIGHLIGHTS ── */}
        <section ref={featuresRef as any} style={{ padding: "100px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            <div ref={features.ref} className={`reveal ${features.inView ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="pill" style={{ marginBottom: 16 }}>Features</div>
              <h2 className="syne" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 14 }}>
                Everything you need to <span className="grad-text">invest smarter</span>
              </h2>
              <p style={{ color: "#64748b", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
                All the tools professional investors use — now accessible to everyone, for free.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {[
                {
                  icon: "📊", title: "Unified Dashboard",
                  desc: "See your entire portfolio at a glance. Current value, XIRR, asset allocation, and goal progress — all in one screen.",
                  delay: "d1", accent: "#8b5cf6",
                },
                {
                  icon: "🎯", title: "Goal Tracking",
                  desc: "Set targets for retirement, a home, or education. We calculate your probability of reaching each goal based on current CAGR.",
                  delay: "d2", accent: "#ec4899",
                },
                {
                  icon: "📥", title: "CAS Import",
                  desc: "Upload your Consolidated Account Statement PDF and we'll import all your transactions automatically — no manual entry needed.",
                  delay: "d3", accent: "#f59e0b",
                },
                {
                  icon: "🔔", title: "SIP Reminders",
                  desc: "Never miss a SIP date. Get email alerts 3 days before each investment is due, powered by automated background jobs.",
                  delay: "d4", accent: "#2dd4bf",
                },
                {
                  icon: "📈", title: "XIRR & CAGR",
                  desc: "Accurate return calculations that account for the exact timing of every investment — the same method used by top fund platforms.",
                  delay: "d1", accent: "#4ade80",
                },
                {
                  icon: "🛡️", title: "Bank-Level Security",
                  desc: "Row-level security means your data is mathematically isolated from other users — even a backend bug can't leak your portfolio.",
                  delay: "d2", accent: "#a78bfa",
                },
              ].map(f => (
                <div key={f.title} ref={features.ref} className={`reveal glass glass-hover ${features.inView ? "visible" : ""} ${f.delay}`}
                  style={{ borderRadius: 20, padding: "28px 26px" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, marginBottom: 18,
                    background: `${f.accent}20`, border: `1px solid ${f.accent}40`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
                  }}>{f.icon}</div>
                  <h3 className="syne" style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section ref={howRef as any} style={{ padding: "100px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>

            <div ref={how.ref} className={`reveal ${how.inView ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="pill" style={{ marginBottom: 16 }}>How It Works</div>
              <h2 className="syne" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Up and running in <span className="grad-text">3 steps</span>
              </h2>
            </div>

            {/* Steps */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 0, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { num: "01", icon: "✍️", title: "Register", sub: "Free Account", desc: "Create your account in under a minute. No credit card, no KYC — just your email.", color: "#8b5cf6" },
                { num: "02", icon: "📤", title: "Import CAS", sub: "Upload PDF", desc: "Upload your CAMS or Karvy CAS PDF. We parse every transaction automatically.", color: "#ec4899" },
                { num: "03", icon: "🚀", title: "Analyze & Grow", sub: "Track Goals", desc: "Your dashboard is live instantly. Set goals, track XIRR, get SIP reminders.", color: "#f59e0b" },
              ].map((step, i) => (
                <div key={step.num} style={{ display: "flex", alignItems: "flex-start", flex: 1, minWidth: 200 }}>
                  <div ref={how.ref} className={`reveal glass glass-hover ${how.inView ? "visible" : ""} d${i + 1}`}
                    style={{ borderRadius: 20, padding: "32px 24px", textAlign: "center", flex: 1, position: "relative" }}>
                    {/* Step number */}
                    <div style={{
                      position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                      background: `linear-gradient(135deg, ${step.color}, ${step.color}99)`,
                      color: "white", fontSize: 11, fontWeight: 700, padding: "3px 12px",
                      borderRadius: 100, letterSpacing: "0.06em"
                    }}>STEP {step.num}</div>

                    <div style={{ fontSize: 36, marginBottom: 16, marginTop: 8 }}>{step.icon}</div>
                    <h3 className="syne" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{step.title}</h3>
                    <p style={{ fontSize: 12, color: step.color, fontWeight: 600, marginBottom: 12, letterSpacing: "0.04em" }}>({step.sub})</p>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{step.desc}</p>
                  </div>

                  {/* Connector arrow between steps */}
                  {i < 2 && (
                    <div style={{ display: "flex", alignItems: "center", padding: "0 12px", paddingTop: 60, flexShrink: 0 }}>
                      <div style={{ fontSize: 20, color: "rgba(139,92,246,0.5)" }}>→</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA below steps */}
            <div ref={how.ref} className={`reveal d4 ${how.inView ? "visible" : ""}`} style={{ textAlign: "center", marginTop: 52 }}>
              <Link href="/signup" className="btn-primary" style={{ fontSize: 16, padding: "15px 36px" }}>
                Start for Free — No Card Required
              </Link>
            </div>
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <section style={{ padding: "60px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="glass stat-glow" style={{ borderRadius: 24, padding: "40px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, textAlign: "center" }}>
              {[
                { val: "10,000+", label: "Mutual Funds", color: "#a78bfa" },
                { val: "₹0", label: "Forever Free", color: "#4ade80" },
                { val: "Real-time", label: "NAV Updates", color: "#2dd4bf" },
                { val: "100%", label: "Data Security", color: "#f472b6" },
              ].map(s => (
                <div key={s.label}>
                  <p className="syne" style={{ fontSize: 32, fontWeight: 800, color: s.color, marginBottom: 6 }}>{s.val}</p>
                  <p style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PUBLIC FUND SEARCH ── */}
        <section style={{ padding: "100px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>

            <div ref={search.ref} className={`reveal ${search.inView ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="pill" style={{ marginBottom: 16 }}>Fund Search</div>
              <h2 className="syne" style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
                Search any <span className="grad-text">mutual fund</span>
              </h2>
              <p style={{ color: "#64748b", fontSize: 15 }}>
                10,000+ schemes from AMFI India. No login required.
              </p>
            </div>

            <div ref={search.ref} className={`reveal d1 ${search.inView ? "visible" : ""}`} style={{ position: "relative" }}>
              <div className="glass" style={{ borderRadius: 18, padding: "6px 6px 6px 20px", display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(139,92,246,0.25)" }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search any mutual fund… (e.g., Axis Bluechip)"
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: "#e2e8f0", fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                    padding: "10px 0"
                  }}
                />
                <button className="btn-primary" style={{ padding: "12px 24px", fontSize: 14, borderRadius: 12 }}>
                  Search
                </button>
              </div>

              {/* Dropdown results */}
              {results.length > 0 && (
                <div className="dropdown">
                  {results.map(r => (
                    <div key={r} className="dropdown-item" onClick={() => setQuery(r)}>
                      📈 {r}
                    </div>
                  ))}
                </div>
              )}

              {query.length >= 2 && results.length === 0 && (
                <div className="dropdown">
                  <div style={{ padding: "16px 18px", fontSize: 14, color: "#475569", textAlign: "center" }}>
                    No funds found. Try a different name.
                  </div>
                </div>
              )}
            </div>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#334155" }}>
              Full search with NAV history available after{" "}
              <Link href="/signup" style={{ color: "#a78bfa", textDecoration: "none" }}>creating a free account</Link>
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "52px 24px 36px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>

              {/* Brand */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💰</div>
                  <span className="syne" style={{ fontSize: 18, fontWeight: 800 }}>WealthWise</span>
                </div>
                <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.65, maxWidth: 260 }}>
                  A free, open-source mutual fund tracking platform built for Indian retail investors. No commissions, no ads.
                </p>
              </div>

              {/* Links */}
              {[
                { heading: "Company", links: ["About Us", "Careers", "Blog"] },
                { heading: "Legal", links: ["Privacy Policy", "Terms of Service", "Disclaimer"] },
                { heading: "Contact", links: ["Support", "FAQ", "GitHub"] },
              ].map(col => (
                <div key={col.heading}>
                  <p className="syne" style={{ fontSize: 13, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>{col.heading}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map(l => (
                      <a key={l} href="#" style={{ fontSize: 14, color: "#334155", textDecoration: "none", transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#c4b5fd")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#334155")}>
                        {l}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <p style={{ fontSize: 12, color: "#1e293b" }}>
                © {new Date().getFullYear()} WealthWise · VTU Internship Project · Team 8
              </p>
              <p style={{ fontSize: 12, color: "#1e293b" }}>
                Data sourced from <span style={{ color: "#334155" }}>AMFI India</span> · Not SEBI registered · For tracking only
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
