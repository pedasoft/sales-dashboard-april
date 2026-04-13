'use client';

import { Doughnut } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

export function DoughnutDistChart({ title, labels, values, colors }: { title: string; labels: string[]; values: number[]; colors: string[] }) {
  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>{title}</h3>
      <Doughnut
        data={{
          labels,
          datasets: [{ data: values, backgroundColor: colors, borderWidth: 1 }]
        }}
        options={{ plugins: { legend: { position: 'bottom' } } }}
      />
    </Card>
  );
}
