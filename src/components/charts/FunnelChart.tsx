'use client';

import { Bar } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

const defaultStages = [
  { label: 'Lead', value: 120 },
  { label: 'Teklif', value: 80 },
  { label: 'Müzakere', value: 45 },
  { label: 'Kazanım', value: 26 }
];

export function FunnelChart({ color }: { color: string }) {
  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>Satış Hunisi</h3>
      <Bar
        data={{
          labels: defaultStages.map((s) => s.label),
          datasets: [{ data: defaultStages.map((s) => s.value), backgroundColor: color }]
        }}
        options={{ indexAxis: 'y', plugins: { legend: { display: false } } }}
      />
    </Card>
  );
}
