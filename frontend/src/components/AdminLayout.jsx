import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ConfirmProvider, useConfirm } from './Confirm.jsx';
import '../admin.css';

const MENU = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/responden', 'Data Tamu'],
  ['/admin/gallery', 'Galeri'],
  ['/admin/ubah-password', 'Ubah Password'],
];

function Shell({ admin }) {
  const nav = useNavigate();
  const confirm = useConfirm();

  async function logout(e) {
    e.preventDefault();
    const ok = await confirm('Anda yakin ingin logout?', { title: 'Konfirmasi Logout', okText: 'Ya, Logout' });
    if (!ok) return;
    try { await api.post('/auth/logout'); } catch { /* tetap keluar walau gagal */ }
    nav('/admin/login', { replace: true });
  }

  return (
    <div className="admin-wrapper">
      <aside className="adm-sidebar">
        <div className="sidebar-header"><h2>SKM Admin</h2></div>
        <nav className="sidebar-menu">
          {MENU.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'menu-item' + (isActive ? ' active' : '')}>{label}</NavLink>
          ))}
          <a href="#logout" className="menu-item menu-logout" onClick={logout}>Logout</a>
        </nav>
      </aside>
      <main className="admin-content"><Outlet context={{ admin }} /></main>
    </div>
  );
}

export default function AdminLayout() {
  const nav = useNavigate();
  const [admin, setAdmin] = useState(null);

  // Tema admin dipasang pada <body> hanya selama area admin terbuka.
  useEffect(() => {
    document.body.classList.add('admin-body');
    return () => document.body.classList.remove('admin-body');
  }, []);

  useEffect(() => {
    api.get('/auth/check')
      .then((r) => setAdmin(r.data || { nama: 'Administrator' }))
      .catch(() => nav('/admin/login', { replace: true }));
  }, [nav]);

  if (!admin) return <div className="adm-muat">Memuat…</div>;

  return (
    <ConfirmProvider>
      <Shell admin={admin} />
    </ConfirmProvider>
  );
}