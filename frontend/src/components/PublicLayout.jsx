import { Link, NavLink, Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <>
      <header className="pub-header">
        <Link to="/" className="brand">BKPSDM Kota Yogyakarta</Link>
        <nav>
          <NavLink to="/" end>Beranda</NavLink>
          <NavLink to="/buku-tamu">Buku Tamu</NavLink>
          <Link to="/admin/login" className="muted">Admin</Link>
        </nav>
      </header>
      <main className="pub-main"><Outlet /></main>
      <footer className="pub-footer">© BKPSDM Kota Yogyakarta</footer>
    </>
  );
}
