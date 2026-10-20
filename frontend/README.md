# Frontend (React + Vite) — Buku Tamu

```bash
npm install
npm run dev        # http://localhost:5173 ; /api dan /storage di-proxy ke Laravel 127.0.0.1:8000
npm run build      # hasil di dist/
```

Produksi: sajikan `dist/` dengan fallback SPA ke `index.html`, dan arahkan `/api` + `/storage` ke backend Laravel
(satu domain, agar cookie sesi admin terkirim).

Halaman: `/` , `/buku-tamu`, `/admin/login`, `/admin/dashboard`, `/admin/responden`, `/admin/gallery`, `/admin/ubah-password`.
Tampilan di `src/styles.css` ditulis ulang; sesuaikan/tempel CSS tema lama (theme-jogja.css dsb.) bila ingin tampilan lama.
