// Format tanggal pendek ala halaman admin: 21/10/2026
export function tglPendek(value) {
  if (!value) return '-';
  const d = new Date(String(value).length === 10 ? value + 'T00:00:00' : value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}