'use client';

import { useMemo, useState } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { useAppStore } from '@/services/useAppStore';
import { buildMonthlySeries, getKPIFromSeries, managerDistribution, productDistribution, quarterBuckets } from '@/services/analytics';
import { KpiCards } from '@/components/dashboards/KpiCards';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { DoughnutDistChart } from '@/components/charts/DoughnutDistChart';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { PolarQuarterChart } from '@/components/charts/PolarQuarterChart';
import { MixedTargetActualChart } from '@/components/charts/MixedTargetActualChart';
import { StackedQuarterChart } from '@/components/charts/StackedQuarterChart';
import { ScatterCorrelationChart } from '@/components/charts/ScatterCorrelationChart';
import { HeatmapGrid } from '@/components/charts/HeatmapGrid';
import { ChartSetup } from '@/components/charts/ChartSetup';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { chartPaletteByTheme } from '@/lib/chart-colors';

export default function GeneralDashboardPage() {
  const { loading, theme, targets, invoices, salesManagers } = useAppStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [distMode, setDistMode] = useState<'product' | 'manager'>('product');
  const colors = chartPaletteByTheme[theme];

  const series = useMemo(
    () =>
      buildMonthlySeries({
        targets,
        invoices,
        managerType: 'sales',
        year
      }),
    [targets, invoices, year]
  );

  const kpi = useMemo(() => getKPIFromSeries(series), [series]);
  const quarters = useMemo(() => quarterBuckets(series), [series]);

  const distribution = useMemo(() => {
    if (distMode === 'product') return productDistribution(invoices, year);
    const names = Object.fromEntries(salesManagers.map((manager) => [manager.id, manager.name]));
    return managerDistribution(invoices, names, year, 'sales');
  }, [distMode, invoices, year, salesManagers]);

  const heatRows = useMemo(
    () =>
      salesManagers
        .filter((manager) => manager.is_active)
        .map((manager) => {
          const managerSeries = buildMonthlySeries({ targets, invoices, managerType: 'sales', managerId: manager.id, year });
          return {
            name: manager.name,
            values: managerSeries.map((m) => m.success)
          };
        }),
    [salesManagers, targets, invoices, year]
  );

  const stackedData = useMemo(
    () =>
      salesManagers
        .filter((manager) => manager.is_active)
        .slice(0, 6)
        .map((manager, idx) => {
          const managerSeries = buildMonthlySeries({ targets, invoices, managerType: 'sales', managerId: manager.id, year });
          return {
            label: manager.name,
            data: quarterBuckets(managerSeries),
            color: colors[idx % colors.length]
          };
        }),
    [salesManagers, targets, invoices, year, colors]
  );

  if (loading) return <LoadingState />;

  return (
    <section className='space-y-4'>
      <ChartSetup />
      <div className='flex flex-wrap items-end gap-3'>
        <h2 className='mr-auto text-2xl font-black'>Genel Dashboard</h2>
        <Input type='number' label='Yıl' value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <Select label='Dağılım Tipi' value={distMode} onChange={(e) => setDistMode(e.target.value as 'product' | 'manager')}>
          <option value='product'>Ürün Bazlı</option>
          <option value='manager'>Yönetici Bazlı</option>
        </Select>
      </div>

      <KpiCards
        items={[
          { label: 'Ekip Toplam Hedef', value: kpi.totalTarget, kind: 'money' },
          { label: 'Ekip Toplam Gerçekleşme', value: kpi.totalActual, kind: 'money' },
          { label: 'Ekip Başarı', value: kpi.successRate, kind: 'percent' },
          { label: 'Toplam Fatura', value: kpi.totalInvoices, kind: 'count' },
          { label: 'Ortalama Fatura', value: kpi.avgInvoiceAmount, kind: 'money' }
        ]}
      />

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        <GaugeChart title='Ekip Başarı İbresi' value={kpi.successRate} color={colors[0]} />
        <DoughnutDistChart title='Gerçekleşme Dağılımı' labels={Object.keys(distribution)} values={Object.values(distribution)} colors={colors} />
        <AreaTrendChart title='Aylık Trend' labels={series.map((s) => s.label)} values={series.map((s) => s.actual)} color={colors[1]} />
        <FunnelChart color={colors[2]} />
        <PolarQuarterChart values={quarters} colors={colors.slice(0, 4)} />
        <MixedTargetActualChart
          labels={series.map((s) => s.label)}
          targets={series.map((s) => s.target)}
          actuals={series.map((s) => s.actual)}
          color={colors[0]}
        />
        <StackedQuarterChart labels={['Q1', 'Q2', 'Q3', 'Q4']} datasets={stackedData} />
        <ScatterCorrelationChart points={series.map((s) => ({ x: s.target, y: s.actual }))} color={colors[3]} />
      </div>

      <HeatmapGrid title='Performans Isı Haritası (Yönetici x Ay)' rows={heatRows} />
    </section>
  );
}
