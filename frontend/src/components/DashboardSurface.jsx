/* Reusable dashboard surface components */

export function PageHero({ eyebrow, title, description, action }) {
  return (
    <header className="ww-panel ww-panel--hero">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ maxWidth: '48rem' }}>
          <p className="ww-eyebrow">{eyebrow}</p>
          <h1 className="ww-heading-md" style={{ marginTop: '0.75rem' }}>{title}</h1>
          {description && <p className="ww-body-sm" style={{ marginTop: '1rem' }}>{description}</p>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    </header>
  );
}

export function SurfacePanel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`ww-panel ${className}`}>
      {(title || action) && (
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              {title && <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>{title}</h2>}
              {subtitle && <p className="ww-body-sm" style={{ marginTop: '0.5rem' }}>{subtitle}</p>}
            </div>
            {action && <div style={{ flexShrink: 0 }}>{action}</div>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricTile({ label, value, note }) {
  return (
    <div className="ww-metric">
      <p className="ww-metric__label">{label}</p>
      <p className="ww-metric__value">{value}</p>
      {note && <p className="ww-metric__note">{note}</p>}
    </div>
  );
}

export function EmptyNotice({ message, tone = 'default' }) {
  const cls = tone === 'error' ? 'ww-notice--error' : tone === 'success' ? 'ww-notice--success' : '';
  return <div className={`ww-notice ${cls}`}>{message}</div>;
}

export function DataPill({ label, value }) {
  return (
    <div className="ww-data-pill">
      <p className="ww-data-pill__label">{label}</p>
      <p className="ww-data-pill__value">{value}</p>
    </div>
  );
}

export function AccentButton({ children, className = '', ...props }) {
  return <button {...props} className={`ww-btn-primary ${className}`}>{children}</button>;
}

export function GhostButton({ children, className = '', ...props }) {
  return <button {...props} className={`ww-btn-ghost ${className}`}>{children}</button>;
}
