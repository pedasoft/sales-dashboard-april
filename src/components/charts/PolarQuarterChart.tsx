'use client';

import { PolarArea } from 'react-chartjs-2';
import { Card } from '@/components/common/Card';

export function PolarQuarterChart({ values, colors }: { values: number[]; colors: string[] }) {
  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>Çeyrek Dağılımı</h3>
      <PolarArea data={{ labels: ['Q1', 'Q2', 'Q3', 'Q4'], datasets: [{ data: values, backgroundColor: colors }] }} />
    </Card>
  );
}
