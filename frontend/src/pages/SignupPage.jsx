import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { AuthShell } from '../components/AuthShell';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  async function handleSignup(e) {
    e?.preventDefault();
    setLoading(true); setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }
    const { error } = await signUp(email, password, fullName);
    if (error) { setError(error.message); setLoading(false); return; }
    navigate('/dashboard');
  }

  return (
    <AuthShell eyebrow="Start free" title="Create your WealthWise account" description="Set up your profile, connect your first goals, and step into the same dark premium interface used across the full product."
      footer={<p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--ww-text-muted)' }}>Already have an account?{' '}<Link to="/login" style={{ fontWeight: 600, color: 'var(--ww-accent-muted)' }}>Sign in</Link></p>}>
      <div style={{ marginBottom: '2rem' }}>
        <p className="ww-eyebrow" style={{ letterSpacing: '0.32em' }}>Signup</p>
        <h2 style={{ marginTop: '0.75rem', fontSize: '1.875rem', fontWeight: 600, color: '#fff' }}>Build your investing workspace</h2>
        <p className="ww-body-sm" style={{ marginTop: '0.5rem' }}>Your account unlocks goals, investments, analytics, reports, and alerts.</p>
      </div>
      {error && <div className="ww-alert ww-alert--error">{error}</div>}
      <form onSubmit={handleSignup} className="ww-space-y-4">
        <Field label="Full name" type="text" value={fullName} onChange={setFullName} placeholder="Rahul Sharma" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" />
        <button type="submit" disabled={loading} className="ww-auth-primary">{loading ? 'Creating account...' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.72)' }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="ww-input" />
    </div>
  );
}
