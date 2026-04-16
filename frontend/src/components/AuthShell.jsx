import { Link } from 'react-router-dom';

export function AuthShell({ title, description, eyebrow, children, footer }) {
  return (
    <main className="ww-auth-shell">
      <div className="ww-aurora" aria-hidden="true" />
      <div className="ww-auth-grid">
        {/* Left Panel */}
        <section className="ww-auth-left">
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', height: '2.75rem', width: '2.75rem', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--ww-accent)', fontSize: '0.875rem', fontWeight: 900, letterSpacing: '0.18em', color: 'var(--ww-accent-dark)' }}>WW</div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', color: '#fff' }}>WealthWise</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ww-text-muted)' }}>Invest with clarity</p>
              </div>
            </Link>

            <div style={{ marginTop: '4rem', maxWidth: '36rem' }}>
              <p className="ww-eyebrow">{eyebrow}</p>
              <h1 className="ww-heading-lg" style={{ marginTop: '1.25rem' }}>{title}</h1>
              <p className="ww-body" style={{ marginTop: '1.25rem' }}>{description}</p>
            </div>

            <div className="ww-grid-3 ww-gap-4" style={{ marginTop: '3rem' }}>
              <div className="ww-metric">
                <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>24</p>
                <p className="ww-body-sm" style={{ marginTop: '0.5rem' }}>Active SIP plans</p>
              </div>
              <div className="ww-metric">
                <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>8 goals</p>
                <p className="ww-body-sm" style={{ marginTop: '0.5rem' }}>Mapped to outcomes</p>
              </div>
              <div className="ww-metric">
                <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>+14.2%</p>
                <p className="ww-body-sm" style={{ marginTop: '0.5rem' }}>Illustrative growth</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', borderRadius: '2rem', border: '1px solid var(--ww-border)', background: '#071510', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.32em', color: 'var(--ww-text-faint)' }}>Platform pulse</p>
            <div className="ww-space-y-3" style={{ marginTop: '1.25rem' }}>
              <div style={{ borderRadius: '1.25rem', background: 'var(--ww-surface)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>Goal-linked planning and investment tracking</div>
              <div style={{ borderRadius: '1.25rem', background: 'var(--ww-surface)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>Alerts, analytics, tax summaries, and reports</div>
              <div style={{ borderRadius: '1.25rem', background: 'var(--ww-surface)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>One consistent WealthWise decision surface</div>
            </div>
          </div>
        </section>

        {/* Right Panel (Form) */}
        <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0' }}>
          <div className="ww-auth-card">
            {children}
            {footer && <div style={{ marginTop: '2rem' }}>{footer}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
