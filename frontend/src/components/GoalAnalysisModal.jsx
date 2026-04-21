import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { formatINR } from '../lib/goalHelpers';

// ── Probability Ring ──────────────────────────────────────────
function ProbabilityRing({ probability }) {
  const radius = 40;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const filled = (probability / 100) * circumference;
  const color = probability >= 60 ? 'var(--ww-accent)' : probability >= 40 ? 'var(--ww-yellow)' : 'var(--ww-negative)';

  return (
    <div className="gam-ring-row">
      <svg width="100" height="100" style={{ flexShrink: 0 }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--ww-border)" strokeWidth={stroke} />
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round" transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="15" fontWeight="700">
          {probability}%
        </text>
      </svg>
      <div>
        <div className="gam-ring-label" style={{ color }}>
          {probability >= 60 ? 'You\'re likely on track 🎉'
            : probability >= 40 ? 'There\'s a reasonable chance'
            : 'This goal needs attention'}
        </div>
        <p className="gam-hint">
          Based on 10,000 possible market scenarios, there is a{' '}
          <strong style={{ color }}>{probability}%</strong> chance your investments reach your goal.
        </p>
      </div>
    </div>
  );
}

// ── Outcome Range Bar ─────────────────────────────────────────
function OutcomeRangeBar({ pessimistic, likely, optimistic, target }) {
  if ([pessimistic, likely, optimistic, target].some((v) => !isFinite(v))) return null;

  const max  = Math.max(optimistic * 1.1, target * 1.1, 1);
  const pPct = (pessimistic / max) * 100;
  const lPct = (likely      / max) * 100;
  const oPct = (optimistic  / max) * 100;
  const tPct = Math.min((target   / max) * 100, 99);

  const dots = [
    { pct: pPct, color: 'var(--ww-negative)',    label: 'Worst case',  value: formatINR(pessimistic) },
    { pct: lPct, color: 'var(--ww-purple)',       label: 'Most likely', value: formatINR(likely) },
    { pct: oPct, color: 'var(--ww-accent)',        label: 'Best case',   value: formatINR(optimistic) },
  ];

  return (
    <div className="gam-range">
      <p className="gam-range-title">Range of possible outcomes</p>

      <div className="gam-range-labels">
        {dots.map(({ pct, color, label, value }) => (
          <div key={label} style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--ww-text-primary)', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', height: 20, marginBottom: 4 }}>
        <div style={{ position: 'absolute', left: `${tPct}%`, transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--ww-text-muted)', fontWeight: 600 }}>
          Goal {formatINR(target)}
        </div>
      </div>

      <div style={{ position: 'relative', height: 36, borderRadius: 99, background: 'var(--ww-border)' }}>
        <div style={{ position: 'absolute', left: `${pPct}%`, width: `${Math.max(oPct - pPct, 2)}%`, height: '100%', background: 'linear-gradient(90deg,rgba(248,113,113,.28),rgba(167,139,250,.4),rgba(180,255,69,.28))', borderRadius: 99 }} />
        <div style={{ position: 'absolute', left: `${tPct}%`, top: 0, height: '100%', width: 2, background: 'var(--ww-text-secondary)', borderRadius: 2 }} />
        {dots.map(({ pct, color }, i) => (
          <div key={i} style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%,-50%)', zIndex: 2, width: 14, height: 14, borderRadius: '50%', background: color, border: '2px solid var(--ww-bg)', boxShadow: '0 1px 4px rgba(0,0,0,.5)' }} />
        ))}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────
export default function GoalAnalysisModal({ goal, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // ── Pre-compute constants from goal ──────────────────────────
  const yearsRemaining = goal.targetDate
    ? Math.max((new Date(goal.targetDate) - new Date()) / (365.25 * 86400000), 0)
    : (goal.monthsRemaining ? goal.monthsRemaining / 12 : 5);
  const annualRate = (parseFloat(goal.expectedReturn) || 12) / 100;
  const months     = Math.max(Math.round(yearsRemaining * 12), 1);
  const targetAmt  = parseFloat(goal.targetAmount) || 0;
  const r          = annualRate / 12;
  // Recommended SIP when none stored
  const recSip = r > 0 && months > 0
    ? (targetAmt * r) / ((Math.pow(1 + r, months) - 1) * (1 + r))
    : (months > 0 ? targetAmt / months : 0);

  // ── Editable simulation inputs — auto-populated ───────────────
  const corpusDefault = parseFloat(goal.currentCorpus) > 0
    ? String(Math.round(parseFloat(goal.currentCorpus))) : '0';
  const sipDefault = parseFloat(goal.monthlyNeed) > 0
    ? String(Math.round(parseFloat(goal.monthlyNeed)))
    : String(Math.round(recSip));           // ← fall back to recommended SIP

  const [portfolio, setPortfolio] = useState(corpusDefault);
  const [sip,       setSip]       = useState(sipDefault);

  // ── Auto-run on mount ─────────────────────────────────────────
  useEffect(() => { runAnalysis(corpusDefault, sipDefault); }, [goal.id]);

  const runAnalysis = async (pf = portfolio, sp = sip) => {
    setLoading(true); setError(null);
    try {
      const payload = {
        initialPortfolio:    Math.max(parseFloat(pf) || 0, 0.01),
        monthlyContribution: parseFloat(sp) || 0,
        monthlyMean:         annualRate / 12,
        monthlyStdDev:       0.045,
        months,
        targetAmount:        targetAmt,
        annualInflationRate: (parseFloat(goal.inflationRate) || 6) / 100,
      };
      setAnalysis(await api.post('/api/learn/analyse', payload));
    } catch (err) {
      setError(err.message || 'Failed to analyse goal.');
    } finally {
      setLoading(false);
    }
  };

  const goalLabel = goal.name || goal.goalType || 'Goal';


  return (
    <AnimatePresence>
      <motion.div className="gw-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="gw-modal"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="gw-header">
            <div>
              <h2 className="gw-title">Goal Analysis</h2>
              <span className="gw-step-label">{goalLabel}</span>
            </div>
            <button className="gw-close" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Body */}
          <div className="gw-body">

            {/* ── Simulation Inputs ── */}
            <div className="gam-sim-panel">
              <p className="gam-sim-title">📊 Simulation Inputs</p>
              <div className="gam-sim-row">
                <div className="gam-sim-field">
                  <label className="gw-label">Current Portfolio (₹)</label>
                  <input
                    type="text" inputMode="numeric" className="gw-input"
                    placeholder="e.g. 50000"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value.replace(/[^0-9.]/g, ''))}
                  />
                </div>
                <div className="gam-sim-field">
                  <label className="gw-label">Monthly SIP (₹)</label>
                  <input
                    type="text" inputMode="numeric" className="gw-input"
                    placeholder={`Rec: ₹${Math.ceil(recSip).toLocaleString('en-IN')}`}
                    value={sip}
                    onChange={(e) => setSip(e.target.value.replace(/[^0-9.]/g, ''))}
                  />
                </div>
              </div>
              <div className="gam-sim-meta">
                <span>🎯 Target: <strong>{formatINR(targetAmt)}</strong></span>
                <span>⏳ {yearsRemaining.toFixed(1)} yrs · {(annualRate * 100).toFixed(0)}% p.a. expected return</span>
              </div>
              <motion.button
                className="gam-run-btn"
                onClick={() => runAnalysis()}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading
                  ? <><div className="gw-spinner" style={{ width: 14, height: 14, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />Running simulations…</>
                  : analysis ? '↻ Re-run with these values' : '▶ Run Analysis'}
              </motion.button>
            </div>

            {loading ? (
              <div className="gw-loading">
                <div className="gw-spinner" />
                <p className="gam-hint">Running 10,000 market simulations…</p>
              </div>
            ) : error ? (
              <div className="gw-info-banner danger"><AlertTriangle size={14} /> {error}</div>
            ) : analysis ? (
              <div className="gam-sections">


                {/* ── Section 1: Probability & Range ── */}
                <div className="gam-section">
                  <h3 className="gw-step-title">Will I reach my goal?</h3>
                  <p className="gam-hint">
                    Your target is <strong>{formatINR(goal.targetAmount)}</strong> (target corpus).
                  </p>
                  <ProbabilityRing probability={analysis.monteCarlo.probability} />

                  <div className="gam-cards-row">
                    {[
                      { label: 'Bad Markets',  value: analysis.monteCarlo.pessimistic, color: 'var(--ww-negative)' },
                      { label: 'Expected',     value: analysis.monteCarlo.likely,      color: 'var(--ww-purple)' },
                      { label: 'Good Markets', value: analysis.monteCarlo.optimistic,  color: 'var(--ww-accent)' },
                    ].map((card) => (
                      <div key={card.label} className="gam-card" style={{ borderColor: card.color + '40' }}>
                        <div className="gam-card-label" style={{ color: card.color }}>{card.label}</div>
                        <div className="gam-card-value">{formatINR(card.value)}</div>
                      </div>
                    ))}
                  </div>

                  <OutcomeRangeBar
                    pessimistic={analysis.monteCarlo.pessimistic}
                    likely={analysis.monteCarlo.likely}
                    optimistic={analysis.monteCarlo.optimistic}
                    target={parseFloat(goal.targetAmount)}
                  />
                </div>

                {/* ── Section 2: Deterministic Baseline ── */}
                <div className="gam-section">
                  <h3 className="gw-step-title">Expected Baseline</h3>
                  <div className="gam-table">
                    <div className="gam-row"><span>Growth on current savings</span><span>{formatINR(analysis.deterministic.fvCorpus)}</span></div>
                    <div className="gam-row"><span>Growth from SIPs</span><span>{formatINR(analysis.deterministic.fvSip)}</span></div>
                    <div className="gam-row gam-row-total"><span>Total Projected (real terms)</span><span>{formatINR(analysis.deterministic.totalProjected)}</span></div>
                  </div>
                  {analysis.deterministic.onTrack ? (
                    <div className="gw-info-banner success">
                      <Sparkles size={14} /> ✅ You're on track! Buffer: {formatINR(Math.abs(analysis.deterministic.gap))}
                    </div>
                  ) : (
                    <div className="gw-info-banner danger">
                      <AlertTriangle size={14} /> ❌ Currently <strong>{formatINR(Math.abs(analysis.deterministic.gap))}</strong> short.
                    </div>
                  )}
                </div>

                {/* ── Section 3: Sensitivity ── */}
                <div className="gam-section">
                  <h3 className="gw-step-title">What could go wrong?</h3>
                  <div className="gam-table">
                    <div className="gam-row gam-row-header"><span>Scenario</span><span>Shortfall</span></div>
                    {analysis.deterministic.sensitivity.map((row, i) => (
                      <div key={i} className="gam-row">
                        <span>{row.scenario}</span>
                        <span style={{ color: row.gap <= 0 ? 'var(--ww-positive)' : 'var(--ww-negative)' }}>
                          {row.gap <= 0 ? '✓ On track' : formatINR(Math.abs(row.gap))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Section 4: Gap-closing fixes ── */}
                {!analysis.requiredSip.currentSipEnough && (
                  <div className="gam-section">
                    <h3 className="gw-step-title">How to close the gap</h3>
                    <div className="gam-fixes">
                      <div className="gam-fix">
                        <div className="gam-fix-num">1</div>
                        <div>
                          <div className="gam-fix-title">
                            Increase SIP by <span className="gam-fix-accent">{formatINR(analysis.requiredSip.sipGap)}/mo</span>
                          </div>
                          <div className="gam-hint">
                            {formatINR(analysis.requiredSip.currentSip)} → {formatINR(analysis.requiredSip.requiredSip)}
                          </div>
                        </div>
                      </div>
                      <div className="gam-fix">
                        <div className="gam-fix-num">2</div>
                        <div>
                          <div className="gam-fix-title">
                            One-time top-up of <span className="gam-fix-accent">{formatINR(analysis.requiredSip.lumpSumToday)}</span>
                          </div>
                          <div className="gam-hint">Invest this lump sum today to catch up instantly.</div>
                        </div>
                      </div>
                      {analysis.requiredSip.extraMonths > 0 && (
                        <div className="gam-fix">
                          <div className="gam-fix-num">3</div>
                          <div>
                            <div className="gam-fix-title">
                              Extend deadline by{' '}
                              <span className="gam-fix-accent">
                                {Math.floor(analysis.requiredSip.extraMonths / 12) > 0 && `${Math.floor(analysis.requiredSip.extraMonths / 12)} yr `}
                                {analysis.requiredSip.extraMonths % 12 > 0 && `${analysis.requiredSip.extraMonths % 12} mo`}
                              </span>
                            </div>
                            <div className="gam-hint">Keep current SIP, give markets more time.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {analysis.requiredSip.currentSipEnough && (
                  <div className="gw-info-banner success">
                    <Sparkles size={14} /> Your current SIP is sufficient — keep it up!
                  </div>
                )}

              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
