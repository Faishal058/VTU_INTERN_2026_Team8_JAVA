import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { EmptyNotice, PageHero, SurfacePanel } from '../components/DashboardSurface';

export default function NewInvestmentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fundName: '', amc: '', category: 'Large Cap', investmentMode: 'SIP',
    amount: '', frequency: 'Monthly', riskProfile: 'Moderate', note: '', schemeCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!form.fundName.trim()) { setError('Fund name is required'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError('Amount must be greater than 0'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/investments', { ...form, amount: Number(form.amount) });
      navigate('/dashboard/investments');
    } catch (err) {
      setError('Failed to save. Make sure the backend is running.');
      setLoading(false);
    }
  }

  return (
    <section className="ww-space-y-6">
      <PageHero eyebrow="New Investment" title="Add a new investment plan"
        description="Save a SIP or lumpsum plan to track your contributions." />
      {error && <div className="ww-alert ww-alert--error">{error}</div>}
      <SurfacePanel>
        <form onSubmit={handleSubmit} className="ww-space-y-4" style={{ maxWidth: '36rem' }}>
          <Field label="Fund Name *" value={form.fundName} onChange={(v) => update('fundName', v)} placeholder="e.g. ICICI Prudential Bluechip Fund" />
          <Field label="AMC" value={form.amc} onChange={(v) => update('amc', v)} placeholder="e.g. ICICI Prudential" />
          <Field label="Scheme Code (AMFI)" value={form.schemeCode} onChange={(v) => update('schemeCode', v)} placeholder="e.g. 119551" />
          <Select label="Category" value={form.category} onChange={(v) => update('category', v)} options={['Large Cap','Mid Cap','Small Cap','Flexi Cap','Index','Debt','Hybrid','Liquid','Other']} />
          <Select label="Mode" value={form.investmentMode} onChange={(v) => update('investmentMode', v)} options={['SIP','Lumpsum']} />
          <Field label="Amount (₹) *" type="number" value={form.amount} onChange={(v) => update('amount', v)} placeholder="5000" />
          <Select label="Frequency" value={form.frequency} onChange={(v) => update('frequency', v)} options={['Monthly','Quarterly','Yearly','One-time']} />
          <Select label="Risk Profile" value={form.riskProfile} onChange={(v) => update('riskProfile', v)} options={['Low','Moderate','High']} />
          <Field label="Note (optional)" value={form.note} onChange={(v) => update('note', v)} placeholder="Any personal notes" />
          <button type="submit" disabled={loading} className="ww-btn-primary ww-btn-primary--lg">
            {loading ? 'Saving...' : 'Save investment'}
          </button>
        </form>
      </SurfacePanel>
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.72)' }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="ww-input" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.72)' }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="ww-input" style={{ color: '#fff' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
