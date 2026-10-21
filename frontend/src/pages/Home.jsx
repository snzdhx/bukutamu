import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import GalleryMarquee from '../components/GalleryMarquee.jsx';
import '../home.css';
import '../kiosk-icons.css';
import logo from '../assets/images/logo-kota-yogyakarta.png';
import qrLapor from '../assets/images/qr-sp4n-lapor.png';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SKM_URL = 'https://skm.go.id/share/instansi/f5c77855-b7f7-414c-9d88-5bf9659e6b53/1';

export default function Home() {
  const [photos, setPhotos] = useState(null); // null = memuat
  const [now, setNow] = useState(new Date());

  // Tema beranda (batik + latar kiosk) dipasang pada <body> hanya selama halaman ini terbuka.
  useEffect(() => {
    document.body.classList.add('jogja', 'kiosk-body');
    return () => document.body.classList.remove('jogja', 'kiosk-body');
  }, []);

  useEffect(() => {
    api.get('/gallery').then((r) => setPhotos(r.data || [])).catch(() => setPhotos([]));
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tanggal = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <>
      <div className="kiosk-page">
        {/* Navigasi atas */}
        <header className="kiosk-topnav">
          <div className="kiosk-topnav-brand">
            <img src={logo} alt="Logo Kota Yogyakarta" className="kiosk-topnav-logo" />
            <div className="kiosk-topnav-text">
              <span className="kiosk-topnav-eyebrow">Layanan mandiri</span>
              <span className="kiosk-topnav-title">Buku Tamu BKPSDM Yogyakarta</span>
            </div>
          </div>
          <nav className="kiosk-topnav-menu">
            <Link to="/" className="kiosk-nav-pill active">Beranda</Link>
            <Link to="/buku-tamu" className="kiosk-nav-pill">Tamu</Link>
            <Link to="/admin/login" className="kiosk-nav-pill">Admin</Link>
          </nav>
        </header>

        <div className="kiosk-sheet">
          {/* Sambutan */}
          <header className="kiosk-header">
            <img src={logo} alt="Logo Kota Yogyakarta" className="kiosk-logo-badge" />
            <div className="kiosk-header-text">
              <span className="kiosk-eyebrow">Sugeng rawuh, selamat datang</span>
              <div className="kiosk-marquee">
                <h1 className="kiosk-marquee-text">
                  Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kota Yogyakarta
                </h1>
              </div>
            </div>
            <div className="kiosk-header-right">
              <div className="kiosk-clock">
                <span className="kiosk-clock-date">{HARI[now.getDay()]}, {tanggal}</span>
                <span className="kiosk-clock-time">{jam}</span>
              </div>
              <Link to="/admin/login" className="kiosk-admin-link" title="Khusus petugas">
                <i className="fas fa-lock" />
              </Link>
            </div>
          </header>

          <div className="jg-kios-isi">
            {/* Pengantar + imbauan anti gratifikasi */}
            <section className="kiosk-intro-grid">
              <div className="kiosk-intro-card">
                <span className="kiosk-intro-eyebrow">SELAMAT DATANG</span>
                <p className="kiosk-intro-lead">Selamat datang di Buku Tamu BKPSDM Kota Yogyakarta.</p>
                <p>
                  Silahkan catat kunjungan Anda di Badan Kepegawaian dan Pengembangan Sumber Daya Manusia
                  Kota Yogyakarta setelah itu anda akan di beri QR CODE untuk mengisi kepuasan masyarakat.
                </p>
                <ol className="kiosk-intro-steps">
                  <li>Klik tombol <strong>"Buku Tamu"</strong> untuk mencatat kunjungan Anda.</li>
                  <li>Isi data diri, periksa kembali, lalu tekan <strong>"Ya, data sudah benar"</strong>.</li>
                </ol>
              </div>

              <div className="kiosk-notice-card">
                <div className="kiosk-notice-banner">
                  <i className="fas fa-shield-halved" /> Kami tidak menerima gratifikasi
                </div>
                <div className="kiosk-notice-body">
                  <i className="fas fa-bookmark" />
                  <p>Kalau pelayanan kami mengecewakan, laporkan lewat SP4N-LAPOR! dengan memindai kode QR berikut.</p>
                </div>
                <div className="kiosk-notice-qr">
                  <img src={qrLapor} alt="Kode QR SP4N-LAPOR" />
                  <span>Pindai untuk melapor</span>
                </div>
              </div>
            </section>

            {/* Tombol aksi utama */}
            <section className="kiosk-actions">
              <Link to="/buku-tamu" className="kiosk-action-card kiosk-action-guest">
                <span className="kiosk-action-icon"><i className="fas fa-clipboard-list" /></span>
                <span className="kiosk-action-text">
                  <span className="kiosk-action-title">Buku Tamu</span>
                  <span className="kiosk-action-sub">Catat Kunjungan Anda.</span>
                </span>
              </Link>

              <a href={SKM_URL} className="kiosk-action-card kiosk-action-survey" target="_blank" rel="noopener noreferrer">
                <span className="kiosk-action-icon"><i className="fas fa-star" /></span>
                <span className="kiosk-action-text">
                  <span className="kiosk-action-title">Survei Kepuasan Masyarakat</span>
                  <span className="kiosk-action-sub">Nilai Layanan Kami.</span>
                </span>
              </a>
            </section>

            {/* Galeri */}
            <section className="gallery-section kiosk-gallery">
              <h2>Galeri</h2>
              <p className="gallery-subtitle">
                {photos === null ? 'Memuat galeri...' : photos.length === 0 ? 'Belum ada foto galeri.' : ''}
              </p>
              {photos && photos.length > 0 ? (
                <GalleryMarquee photos={photos} />
              ) : (
                photos === null && (
                  <div className="gallery-placeholder"><i className="fas fa-image" /></div>
                )
              )}
            </section>
          </div>
        </div>
      </div>

      <footer className="kiosk-footer">
        <p>
          <strong>BKPSDM Kota Yogyakarta</strong><br />
          &copy; {now.getFullYear()} Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kota Yogyakarta
        </p>
      </footer>
    </>
  );
}