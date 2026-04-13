'use client';

import { Line } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

export function AreaTrendChart({ title, labels, values, color }: { title: string; labels: string[]; values: number[]; color: string }) {
  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>{title}</h3>
      <Line
        data={{
          labels,
          datasets: [{
            data: values,
            label: 'Gerçekleşme',
            borderColor: color,
            backgroundColor: `${color}33`,
            fill: true,
            tension: 0.3
          }]
        }}
      />
    </Card>
  );
}
