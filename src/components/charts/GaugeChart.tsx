'use client';

import { Doughnut } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

export function GaugeChart({ title, value, color }: { title: string; value: number; color: string }) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>{title}</h3>
      <div className='mx-auto max-w-[240px]'>
        <Doughnut
          data={{
            labels: ['Başarı', 'Kalan'],
            datasets: [
              {
                data: [safe, 100 - safe],
                backgroundColor: [color, '#e2e8f0'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
              }
            ]
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } }
          }}
        />
        <div className='-mt-6 text-center text-2xl font-black'>{safe.toFixed(1)}%</div>
      </div>
    </Card>
  );
}
