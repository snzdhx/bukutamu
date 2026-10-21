import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import '../login.css';
import '../kiosk-icons.css';
import logo from '../assets/images/logo-kota-yogyakarta.png';

export default function Login() {
  const nav = useNavigate();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const userRef = useRef(null);

  // Latar hijau halaman login dipasang pada <body> hanya selama halaman ini terbuka.
  useEffect(() => {
    document.body.classList.add('login-body');
    return () => document.body.classList.remove('login-body');
  }, []);

  // Kalau sesi masih aktif di server, langsung ke dashboard.
  useEffect(() => {
    api.get('/auth/check').then(() => nav('/admin/dashboard', { replace: true })).catch(() => {});
  }, [nav]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api.post('/auth/login', { username: u, password: p });
      nav('/admin/dashboard', { replace: true });
    } catch (x) {
      setErr(x.status === 0 ? 'Tidak dapat menghubungi server. Coba lagi.' : (x.message || 'Username atau password salah!'));
      setP('');
      userRef.current?.focus();
    } finally { setBusy(false); }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="Logo Kota Yogyakarta" className="login-logo" />
          <h1>Admin Panel</h1>
          <p>E-SKM BKPSDM Kota Yogyakarta</p>
        </div>

        <form onSubmit={submit}>
          {err && <div className="error-message" role="alert">❌ {err}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input ref={userRef} type="text" id="username" placeholder="Masukkan username" autoComplete="username"
              required autoFocus value={u} onChange={(e) => setU(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Masukkan password" autoComplete="current-password"
              required value={p} onChange={(e) => setP(e.target.value)} />
          </div>

          <button type="submit" className="login-button" disabled={busy}>{busy ? 'Memeriksa...' : 'Masuk'}</button>
        </form>

        <p className="login-note">Khusus petugas. Hubungi administrator sistem jika lupa kata sandi.</p>

        <button type="button" className="back-home-button" onClick={() => nav('/')}>
          <i className="fas fa-arrow-left" /> Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}