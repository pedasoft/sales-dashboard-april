'use client';

import { Radar } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

export function RadarPerformanceChart({ values, color }: { values: number[]; color: string }) {
  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>Yönetici Performans Radar</h3>
      <Radar
        data={{
          labels: ['Hedef Tutturma', 'Trend İstikrarı', 'Çeyrek Büyüme', 'Fatura Adedi', 'Ortalama Fatura', 'Büyük Fatura Oranı'],
          datasets: [
            {
              label: 'Skor',
              data: values,
              borderColor: color,
              backgroundColor: `${color}33`
            }
          ]
        }}
        options={{ scales: { r: { min: 0, max: 100 } } }}
      />
    </Card>
  );
}
