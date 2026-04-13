import { MONTHS } from '@/lib/constants';
import { Invoice, KPIData, ManagerType, Target } from '@/types/domain';

interface MonthlyPoint {
  month: number;
  label: string;
  target: number;
  actual: number;
  success: number;
  invoiceCount: number;
}

export function getMonthlyActuals(invoices: Invoice[], managerType: ManagerType, managerId?: string, year?: number) {
  const map: Record<number, number> = {};

  invoices.forEach((inv) => {
    const date = new Date(inv.invoice_date);
    const month = date.getMonth() + 1;
    const invYear = date.getFullYear();
    const managerMatch = managerType === 'sales' ? inv.sales_manager_id === managerId : inv.product_manager_id === managerId;

    if ((!managerId || managerMatch) && (!year || invYear === year)) {
      map[month] = (map[month] || 0) + Number(inv.amount);
    }
  });

  return map;
}

export function getMonthlyTargets(targets: Target[], managerType: ManagerType, managerId?: string, year?: number) {
  const map: Record<number, number> = {};

  targets.forEach((target) => {
    if (target.manager_type !== managerType) return;
    if (managerId && target.manager_id !== managerId) return;
    if (year && target.year !== year) return;
    map[target.month] = (map[target.month] || 0) + Number(target.target_amount);
  });

  return map;
}

export function buildMonthlySeries({
  targets,
  invoices,
  managerType,
  managerId,
  year
}: {
  targets: Target[];
  invoices: Invoice[];
  managerType: ManagerType;
  managerId?: string;
  year: number;
}): MonthlyPoint[] {
  const targetMap = getMonthlyTargets(targets, managerType, managerId, year);
  const actualMap = getMonthlyActuals(invoices, managerType, managerId, year);

  return Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1;
    const target = targetMap[month] || 0;
    const actual = actualMap[month] || 0;
    const success = target > 0 ? (actual / target) * 100 : 0;
    const invoiceCount = invoices.filter((inv) => {
      const date = new Date(inv.invoice_date);
      const managerMatch = managerType === 'sales' ? inv.sales_manager_id === managerId : inv.product_manager_id === managerId;
      return date.getFullYear() === year && date.getMonth() + 1 === month && (!managerId || managerMatch);
    }).length;

    return {
      month,
      label: MONTHS[idx],
      target,
      actual,
      success,
      invoiceCount
    };
  });
}

export function getKPIFromSeries(series: MonthlyPoint[]): KPIData {
  const totalTarget = series.reduce((acc, item) => acc + item.target, 0);
  const totalActual = series.reduce((acc, item) => acc + item.actual, 0);
  const totalInvoices = series.reduce((acc, item) => acc + item.invoiceCount, 0);

  return {
    totalTarget,
    totalActual,
    successRate: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
    totalInvoices,
    avgInvoiceAmount: totalInvoices > 0 ? totalActual / totalInvoices : 0
  };
}

export function quarterBuckets(series: MonthlyPoint[]) {
  return [
    series.slice(0, 3).reduce((sum, item) => sum + item.actual, 0),
    series.slice(3, 6).reduce((sum, item) => sum + item.actual, 0),
    series.slice(6, 9).reduce((sum, item) => sum + item.actual, 0),
    series.slice(9, 12).reduce((sum, item) => sum + item.actual, 0)
  ];
}

export function bestWorstMonth(series: MonthlyPoint[]) {
  const sorted = [...series].sort((a, b) => b.success - a.success);
  return {
    best: sorted[0] ?? null,
    worst: sorted[sorted.length - 1] ?? null
  };
}

export function productDistribution(invoices: Invoice[], year: number) {
  const map: Record<string, number> = {};
  invoices.forEach((invoice) => {
    if (new Date(invoice.invoice_date).getFullYear() !== year) return;
    map[invoice.product] = (map[invoice.product] || 0) + Number(invoice.amount);
  });

  return map;
}

export function managerDistribution(invoices: Invoice[], managerNames: Record<string, string>, year: number, type: ManagerType) {
  const map: Record<string, number> = {};
  invoices.forEach((invoice) => {
    if (new Date(invoice.invoice_date).getFullYear() !== year) return;
    const id = type === 'sales' ? invoice.sales_manager_id : invoice.product_manager_id;
    const name = managerNames[id] ?? 'Bilinmeyen';
    map[name] = (map[name] || 0) + Number(invoice.amount);
  });

  return map;
}
