import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { AuthShell } from '../components/AuthShell';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithPassword } = useAuth();

  async function handleLogin(e) {
    e?.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signInWithPassword(email, password);
    if (error) { setError(error.message); setLoading(false); return; }
    navigate('/dashboard');
  }

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to your WealthWise workspace" description="Pick up where you left off with your goals, SIP plans, analytics, and alerts in one consistent investing flow."
      footer={<p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--ww-text-muted)' }}>Don&apos;t have an account?{' '}<Link to="/signup" style={{ fontWeight: 600, color: 'var(--ww-accent-muted)' }}>Sign up free</Link></p>}>
      <div style={{ marginBottom: '2rem' }}>
        <p className="ww-eyebrow" style={{ letterSpacing: '0.32em' }}>Login</p>
        <h2 style={{ marginTop: '0.75rem', fontSize: '1.875rem', fontWeight: 600, color: '#fff' }}>Access your dashboard</h2>
        <p className="ww-body-sm" style={{ marginTop: '0.5rem' }}>Use your email and password to sign in.</p>
      </div>
      {error && <div className="ww-alert ww-alert--error">{error}</div>}
      <form onSubmit={handleLogin} className="ww-space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" />
        <button type="submit" disabled={loading} className="ww-auth-primary">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>
        <Link to="/forgot-password" style={{ fontWeight: 600, color: 'var(--ww-accent-muted)' }}>Forgot password?</Link>
      </div>
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
