'use client';

import { Card } from '@/components/common/Card';

interface HeatmapRow {
  name: string;
  values: number[];
}

export function HeatmapGrid({ title, rows }: { title: string; rows: HeatmapRow[] }) {
  const shade = (value: number) => {
    const safe = Math.max(0, Math.min(100, value));
    const alpha = 0.12 + safe / 120;
    return `rgba(37,99,235,${alpha})`;
  };

  return (
    <Card>
      <h3 className='mb-3 text-sm font-bold'>{title}</h3>
      <div className='overflow-auto'>
        <table className='w-full text-xs'>
          <thead>
            <tr>
              <th className='px-2 py-1 text-left'>Yönetici</th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i} className='px-2 py-1'>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td className='whitespace-nowrap px-2 py-1 font-medium'>{row.name}</td>
                {row.values.map((value, idx) => (
                  <td key={`${row.name}-${idx}`} className='px-2 py-1 text-center font-semibold' style={{ backgroundColor: shade(value) }}>
                    {value.toFixed(0)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
