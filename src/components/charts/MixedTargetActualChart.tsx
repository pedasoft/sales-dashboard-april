'use client';

import { Chart } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

export function MixedTargetActualChart({ labels, targets, actuals, color }: { labels: string[]; targets: number[]; actuals: number[]; color: string }) {
  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>Aylık Hedef vs Gerçekleşme</h3>
      <Chart
        type='bar'
        data={{
          labels,
          datasets: [
            { type: 'bar', label: 'Hedef', data: targets, backgroundColor: `${color}66` },
            { type: 'line', label: 'Gerçekleşme', data: actuals, borderColor: color, tension: 0.3 }
          ]
        }}
      />
    </Card>
  );
}
