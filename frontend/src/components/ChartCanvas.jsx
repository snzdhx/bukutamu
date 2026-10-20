import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function ChartCanvas({ type, labels, data, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const chart = new Chart(ref.current, {
      type,
      data: { labels, datasets: [{ label, data, borderWidth: 1, tension: 0.3,
        backgroundColor: type === 'line' ? 'rgba(180,30,30,.15)' : ['#b41e1e','#d9822b','#2f7d6d','#3b5ba9','#7a4fa0','#c24c7a','#6d7f2f','#555','#999'],
        borderColor: '#b41e1e', fill: type === 'line' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type !== 'line' && type !== 'bar' } } },
    });
    return () => chart.destroy();
  }, [type, labels, data, label]);
  return <div className="chart-box"><canvas ref={ref} /></div>;
}
