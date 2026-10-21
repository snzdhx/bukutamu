import { useEffect, useRef } from 'react';

const SPEED = 40; // px per detik
const NUDGE = 240; // geser manual ~1 foto

// Galeri 1 baris, berjalan otomatis ke kanan; panah untuk geser manual (jeda 2,5 dtk).
export default function GalleryMarquee({ photos }) {
  const trackRef = useRef(null);
  const nudgeRef = useRef(() => {});

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let half = 0;
    let offset = 0;
    let last = null;
    let paused = false;
    let resume = null;
    let raf = 0;

    const apply = () => { track.style.transform = `translateX(${offset}px)`; };
    const normalize = () => {
      if (half <= 0) return;
      if (offset > 0) offset -= half;
      if (offset <= -half) offset += half;
    };
    const measure = () => {
      const h = track.scrollWidth / 2;
      if (half <= 0 && h > 0) offset = -h; // mulai mundur agar ada ruang bergerak ke kanan
      half = h;
      apply();
    };
    const step = (ts) => {
      if (last === null) last = ts;
      const dt = (ts - last) / 1000;
      last = ts;
      if (!paused && half > 0) {
        offset += SPEED * dt;
        normalize();
        apply();
      }
      raf = requestAnimationFrame(step);
    };

    nudgeRef.current = (dir) => {
      if (half <= 0) return;
      offset += dir * NUDGE;
      normalize();
      apply();
      paused = true;
      clearTimeout(resume);
      resume = setTimeout(() => { paused = false; }, 2500);
    };

    window.addEventListener('resize', measure);
    raf = requestAnimationFrame(() => { measure(); raf = requestAnimationFrame(step); });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resume);
      window.removeEventListener('resize', measure);
    };
  }, [photos]);

  const items = photos.map((p) => (
    <figure className="gallery-photo-item" key={p.gallery_id}>
      <img src={p.file_url} alt={p.gallery_name} loading="lazy" />
      <figcaption>{p.gallery_name}</figcaption>
    </figure>
  ));

  return (
    <div className="gallery-rows">
      <div className="gallery-row-wrapper">
        <button type="button" className="gallery-arrow gallery-arrow-left" aria-label="Geser ke kiri" onClick={() => nudgeRef.current(-1)}>
          <i className="fas fa-chevron-left" />
        </button>
        <div className="gallery-track-viewport">
          <div className="gallery-track" ref={trackRef}>
            {items}
            {photos.map((p) => (
              <figure className="gallery-photo-item" key={`dup-${p.gallery_id}`} aria-hidden="true">
                <img src={p.file_url} alt="" loading="lazy" />
                <figcaption>{p.gallery_name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <button type="button" className="gallery-arrow gallery-arrow-right" aria-label="Geser ke kanan" onClick={() => nudgeRef.current(1)}>
          <i className="fas fa-chevron-right" />
        </button>
      </div>
    </div>
  );
}