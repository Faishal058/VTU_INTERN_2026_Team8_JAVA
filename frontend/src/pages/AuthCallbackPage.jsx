import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Auth callback — redirects to login (JWT auth flow does not use OAuth callbacks). */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/login', { replace: true }); }, [navigate]);
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--ww-bg)', color: '#fff' }}>
      <p>Redirecting...</p>
    </div>
  );
}
