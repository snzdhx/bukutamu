import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ConfirmProvider } from './Confirm.jsx';

const MENU = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/responden', 'Data Tamu'],
  ['/admin/gallery', 'Galeri'],
  ['/admin/ubah-password', 'Ubah Password'],
];

export default function AdminLayout() {
  const nav = useNavigate();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    api.get('/auth/check')
      .then((r) => setAdmin(r.data || { nama: 'Admin' }))
      .catch(() => nav('/admin/login', { replace: true }));
  }, [nav]);

  async function logout() {
    try { await api.post('/auth/logout'); } catch { /* abaikan */ }
    nav('/admin/login', { replace: true });
  }

  if (!admin) return <div className="center-screen">Memuat…</div>;

  return (
    <ConfirmProvider>
      <div className="admin">
        <aside className="sidebar">
          <div className="brand">E-SKM Admin</div>
          {MENU.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
          <div className="spacer" />
          <small>{admin.nama || admin.username}</small>
          <button className="btn ghost" onClick={logout}>Keluar</button>
        </aside>
        <section className="content"><Outlet /></section>
      </div>
    </ConfirmProvider>
  );
}
