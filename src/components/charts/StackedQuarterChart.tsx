'use client';

import { Bar } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

export function StackedQuarterChart({ labels, datasets }: { labels: string[]; datasets: { label: string; data: number[]; color: string }[] }) {
  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>Çeyreklik Performans (Stacked)</h3>
      <Bar
        data={{
          labels,
          datasets: datasets.map((ds) => ({ label: ds.label, data: ds.data, backgroundColor: ds.color }))
        }}
        options={{ scales: { x: { stacked: true }, y: { stacked: true } } }}
      />
    </Card>
  );
}
