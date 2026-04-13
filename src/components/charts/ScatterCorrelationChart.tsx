'use client';

import { Scatter } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

export function ScatterCorrelationChart({ points, color }: { points: { x: number; y: number }[]; color: string }) {
  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>Hedef-Gerçekleşme Korelasyonu</h3>
      <Scatter
        data={{
          datasets: [{ label: 'Aylar', data: points, backgroundColor: color }]
        }}
      />
    </Card>
  );
}
