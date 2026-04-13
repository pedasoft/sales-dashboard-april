import { Card } from '@/components/common/Card';
import { formatMoney, formatPercent } from '@/lib/format';

export function KpiCards({
  items
}: {
  items: {
    label: string;
    value: number;
    kind?: 'money' | 'percent' | 'count';
  }[];
}) {
  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5'>
      {items.map((item) => (
        <Card key={item.label}>
          <div className='text-xs font-semibold text-muted'>{item.label}</div>
          <div className='mt-2 text-xl font-black'>
            {item.kind === 'money' ? formatMoney(item.value) : item.kind === 'percent' ? formatPercent(item.value) : item.value.toLocaleString('tr-TR')}
          </div>
        </Card>
      ))}
    </div>
  );
}
