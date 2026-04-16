import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { EmptyNotice, PageHero, SurfacePanel } from '../components/DashboardSurface';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ fullName: '', phone: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user) return;
    api.get('/api/profile').then(data => {
      if (data) setProfile({ fullName: data.fullName || user.fullName || '', phone: data.phone || '' });
      else setProfile({ fullName: user.fullName || '', phone: '' });
    }).catch(() => setProfile({ fullName: user.fullName || '', phone: '' }));
  }, [user]);

  async function saveProfile(e) {
    e?.preventDefault();
    setSaving(true); setMsg({ text: '', type: '' });
    try {
      await api.put('/api/profile', profile);
      setMsg({ text: 'Profile saved successfully!', type: 'success' });
    } catch {
      setMsg({ text: 'Failed to save. Is the backend running?', type: 'error' });
    }
    setSaving(false);
  }

  async function changePassword(e) {
    e?.preventDefault();
    if (pwForm.newPw.length < 8) { setMsg({ text: 'New password must be at least 8 characters', type: 'error' }); return; }
    if (pwForm.newPw !== pwForm.confirm) { setMsg({ text: 'Passwords do not match', type: 'error' }); return; }
    setPwSaving(true); setMsg({ text: '', type: '' });
    try {
      await api.post('/api/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setMsg({ text: 'Password changed successfully!', type: 'success' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch {
      setMsg({ text: 'Failed to change password. Check your current password.', type: 'error' });
    }
    setPwSaving(false);
  }

  return (
    <section className="ww-space-y-6">
      <PageHero eyebrow="Profile" title="Manage your account" description="Update your name, contact details, and password." />

      {msg.text && (
        <div className={`ww-alert ${msg.type === 'error' ? 'ww-alert--error' : 'ww-alert--success'}`}>{msg.text}</div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr' }} className="ww-profile-layout">
        {/* Personal details */}
        <SurfacePanel title="Personal details" subtitle="Your display name and contact info.">
          <form onSubmit={saveProfile} className="ww-space-y-4" style={{ maxWidth: '32rem' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={user?.email || ''} disabled className="ww-input" style={{ opacity: 0.55 }} />
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)' }}>Email cannot be changed here.</p>
            </div>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} className="ww-input" placeholder="Your full name" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="ww-input" placeholder="+91 9876543210" />
            </div>
            <button type="submit" disabled={saving} className="ww-btn-primary">{saving ? 'Saving...' : 'Save profile'}</button>
          </form>
        </SurfacePanel>

        {/* Change password */}
        <SurfacePanel title="Change password" subtitle="Update your login password.">
          <form onSubmit={changePassword} className="ww-space-y-4" style={{ maxWidth: '32rem' }}>
            <div>
              <label style={labelStyle}>Current password</label>
              <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} className="ww-input" placeholder="Your current password" />
            </div>
            <div>
              <label style={labelStyle}>New password</label>
              <input type="password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} className="ww-input" placeholder="Minimum 8 characters" />
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} className="ww-input" placeholder="Re-enter new password" />
            </div>
            <button type="submit" disabled={pwSaving} className="ww-btn-primary">{pwSaving ? 'Updating...' : 'Change password'}</button>
          </form>
        </SurfacePanel>

        {/* Account info */}
        <SurfacePanel title="Account info">
          <div className="ww-space-y-3">
            {[
              { label: 'Account ID', value: user?.id || '—' },
              { label: 'Email', value: user?.email || '—' },
              { label: 'Name', value: user?.fullName || '—' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                <span style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 500, wordBreak: 'break-all', maxWidth: '60%', textAlign: 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </SurfacePanel>
      </div>
      <style>{`.ww-profile-layout { grid-template-columns: 1fr; } @media (min-width: 1024px) { .ww-profile-layout { grid-template-columns: 1fr 1fr; } }`}</style>
    </section>
  );
}

const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.72)' };
