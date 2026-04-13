'use client';

import { useMemo, useState } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { useAppStore } from '@/services/useAppStore';
import { bestWorstMonth, buildMonthlySeries, getKPIFromSeries, quarterBuckets } from '@/services/analytics';
import { KpiCards } from '@/components/dashboards/KpiCards';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { RadarPerformanceChart } from '@/components/charts/RadarPerformanceChart';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { PolarQuarterChart } from '@/components/charts/PolarQuarterChart';
import { MixedTargetActualChart } from '@/components/charts/MixedTargetActualChart';
import { HeatmapGrid } from '@/components/charts/HeatmapGrid';
import { ChartSetup } from '@/components/charts/ChartSetup';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { chartPaletteByTheme } from '@/lib/chart-colors';
import { Card } from '@/components/common/Card';

export default function PersonalDashboardPage() {
  const { loading, theme, targets, invoices, salesManagers, productManagers } = useAppStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [managerType, setManagerType] = useState<'sales' | 'product'>('sales');
  const [managerId, setManagerId] = useState('');
  const colors = chartPaletteByTheme[theme];

  const managerList = managerType === 'sales' ? salesManagers.filter((m) => m.is_active) : productManagers.filter((m) => m.is_active);

  const series = useMemo(() => {
    if (!managerId) return [];
    return buildMonthlySeries({ targets, invoices, managerType, managerId, year });
  }, [targets, invoices, managerType, managerId, year]);

  const kpi = useMemo(() => getKPIFromSeries(series), [series]);
  const quarterValues = useMemo(() => quarterBuckets(series), [series]);
  const { best, worst } = useMemo(() => bestWorstMonth(series), [series]);

  const radarData = useMemo(() => {
    if (series.length === 0) return [0, 0, 0, 0, 0, 0];
    const targetHit = kpi.successRate;
    const avgSuccess = series.reduce((acc, s) => acc + s.success, 0) / series.length;
    const volatility = series.reduce((acc, s) => acc + Math.abs(s.success - avgSuccess), 0) / series.length;
    const stability = Math.max(0, 100 - volatility);
    const growth = series[11] && series[0] && series[0].actual > 0 ? Math.min(100, (series[11].actual / series[0].actual) * 100) : 0;
    const invoiceCount = Math.min(100, (kpi.totalInvoices / 150) * 100);
    const avgInvoice = Math.min(100, (kpi.avgInvoiceAmount / 200000) * 100);

    const filteredInvoices = invoices.filter((inv) => {
      const date = new Date(inv.invoice_date);
      const hitManager = managerType === 'sales' ? inv.sales_manager_id === managerId : inv.product_manager_id === managerId;
      return date.getFullYear() === year && hitManager;
    });

    const largeRatio = filteredInvoices.length
      ? (filteredInvoices.filter((inv) => Number(inv.amount) >= 100000).length / filteredInvoices.length) * 100
      : 0;

    return [targetHit, stability, growth, invoiceCount, avgInvoice, largeRatio];
  }, [series, kpi, invoices, managerType, managerId, year]);

  const heatRows = useMemo(() => {
    if (!managerId || series.length === 0) return [];
    const managerName = managerList.find((m) => m.id === managerId)?.name ?? 'Yönetici';
    return [{ name: managerName, values: series.map((s) => s.success) }];
  }, [managerId, series, managerList]);

  if (loading) return <LoadingState />;

  return (
    <section className='space-y-4'>
      <ChartSetup />
      <div className='flex flex-wrap items-end gap-3'>
        <h2 className='mr-auto text-2xl font-black'>Kişisel Dashboard</h2>
        <Select label='Tip' value={managerType} onChange={(e) => {
          setManagerType(e.target.value as 'sales' | 'product');
          setManagerId('');
        }}>
          <option value='sales'>Satış</option>
          <option value='product'>Ürün</option>
        </Select>
        <Select label='Yönetici' value={managerId} onChange={(e) => setManagerId(e.target.value)}>
          <option value=''>Seçiniz</option>
          {managerList.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.name}
            </option>
          ))}
        </Select>
        <Input type='number' label='Yıl' value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>

      {!managerId ? (
        <Card>Devam etmek için yönetici seçiniz.</Card>
      ) : (
        <>
          <KpiCards
            items={[
              { label: 'Yıl Hedef', value: kpi.totalTarget, kind: 'money' },
              { label: 'Yıl Gerçekleşme', value: kpi.totalActual, kind: 'money' },
              { label: 'Yıl Başarı', value: kpi.successRate, kind: 'percent' },
              { label: 'En İyi Ay', value: best?.success ?? 0, kind: 'percent' },
              { label: 'En Kötü Ay', value: worst?.success ?? 0, kind: 'percent' }
            ]}
          />

          <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
            <GaugeChart title='Başarı Göstergesi' value={kpi.successRate} color={colors[0]} />
            <RadarPerformanceChart values={radarData} color={colors[1]} />
            <AreaTrendChart title='Aylık Gerçekleşme Trend' labels={series.map((s) => s.label)} values={series.map((s) => s.actual)} color={colors[2]} />
            <PolarQuarterChart values={quarterValues} colors={colors.slice(0, 4)} />
            <MixedTargetActualChart
              labels={series.map((s) => s.label)}
              targets={series.map((s) => s.target)}
              actuals={series.map((s) => s.actual)}
              color={colors[0]}
            />
          </div>

          <HeatmapGrid title='Yönetici Isı Haritası' rows={heatRows} />
        </>
      )}
    </section>
  );
}
