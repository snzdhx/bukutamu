import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Menggambar satu grafik Chart.js dari objek konfigurasi. `config` sebaiknya di-memo
// (useMemo) agar grafik hanya digambar ulang saat datanya berubah.
export default function ChartCanvas({ config }) {
  const ref = useRef(null);
  useEffect(() => {
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
  }, [config]);
  return <canvas ref={ref} />;
}