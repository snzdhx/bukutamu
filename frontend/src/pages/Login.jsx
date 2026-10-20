import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Login() {
  const nav = useNavigate();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/auth/check').then(() => nav('/admin/dashboard', { replace: true })).catch(() => {});
  }, [nav]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api.post('/auth/login', { username: u, password: p });
      nav('/admin/dashboard', { replace: true });
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }

  return (
    <div className="center-screen">
      <form className="card form narrow" onSubmit={submit}>
        <h1>Login Admin</h1>
        {err && <div className="alert err">{err}</div>}
        <label>Username<input autoFocus required value={u} onChange={(e) => setU(e.target.value)} /></label>
        <label>Password<input required type="password" value={p} onChange={(e) => setP(e.target.value)} /></label>
        <button className="btn primary big" disabled={busy}>{busy ? 'Masuk…' : 'Masuk'}</button>
      </form>
    </div>
  );
}
