import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    api.get('/gallery').then((r) => setPhotos(r.data || [])).catch(() => {});
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Selamat Datang</h1>
        <p>Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kota Yogyakarta</p>
        <div className="clock">
          {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}
          {now.toLocaleTimeString('id-ID')}
        </div>
        <Link to="/buku-tamu" className="btn primary big">Isi Buku Tamu</Link>
      </section>

      {photos.length > 0 && (
        <section>
          <h2>Galeri</h2>
          <div className="gallery-grid">
            {photos.map((p) => (
              <figure key={p.gallery_id}>
                <img src={p.file_url} alt={p.gallery_name} loading="lazy" />
                <figcaption>{p.gallery_name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
