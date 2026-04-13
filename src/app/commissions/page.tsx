'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { Select } from '@/components/common/Select';
import { coefficientSchema, commissionSchema } from '@/forms/schemas';
import { formatMoney } from '@/lib/format';
import { deleteCommission, saveCommission, upsertCoefficient } from '@/services/db';
import { useAppStore } from '@/services/useAppStore';
import { useToast } from '@/components/common/ToastProvider';
import { askConfirm } from '@/components/common/Confirm';
import { exportToExcel } from '@/utils/excel';

export default function CommissionsPage() {
  const { loading, salesManagers, productManagers, coefficients, commissions, invoices, refreshAll } = useAppStore();
  const { push } = useToast();

  const coefficientForm = useForm<z.infer<typeof coefficientSchema>>({
    resolver: zodResolver(coefficientSchema),
    defaultValues: { manager_type: 'sales', manager_id: '', coefficient: 0 }
  });

  const commissionForm = useForm<z.infer<typeof commissionSchema>>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      manager_type: 'sales',
      manager_id: '',
      multiplier: 1,
      extra_amount: 0
    }
  });

  const commissionType = commissionForm.watch('manager_type');
  const commissionManagerId = commissionForm.watch('manager_id');
  const commissionYear = commissionForm.watch('year');
  const commissionMonth = commissionForm.watch('month');
  const commissionMultiplier = commissionForm.watch('multiplier');
  const commissionExtraAmount = commissionForm.watch('extra_amount');

  const managerOptions = commissionType === 'sales' ? salesManagers.filter((m) => m.is_active) : productManagers.filter((m) => m.is_active);

  const actualAmount = useMemo(() => {
    return invoices
      .filter((inv) => {
        const date = new Date(inv.invoice_date);
        const idMatch = commissionType === 'sales' ? inv.sales_manager_id === commissionManagerId : inv.product_manager_id === commissionManagerId;
        return date.getFullYear() === commissionYear && date.getMonth() + 1 === commissionMonth && idMatch;
      })
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }, [invoices, commissionType, commissionManagerId, commissionYear, commissionMonth]);

  const coefficient = useMemo(() => {
    return coefficients.find((c) => c.manager_type === commissionType && c.manager_id === commissionManagerId)?.coefficient || 0;
  }, [coefficients, commissionType, commissionManagerId]);

  const base = actualAmount * coefficient;
  const total = base * Number(commissionMultiplier || 1) + Number(commissionExtraAmount || 0);

  const columns = useMemo<ColumnDef<(typeof commissions)[number]>[]>(
    () => [
      { header: 'Yıl', accessorKey: 'year' },
      { header: 'Ay', accessorKey: 'month' },
      { header: 'Tip', cell: ({ row }) => (row.original.manager_type === 'sales' ? 'Satış' : 'Ürün') },
      {
        header: 'Yönetici',
        cell: ({ row }) => {
          const list = row.original.manager_type === 'sales' ? salesManagers : productManagers;
          return list.find((m) => m.id === row.original.manager_id)?.name ?? 'Bilinmeyen';
        }
      },
      { header: 'Base', cell: ({ row }) => formatMoney(Number(row.original.base_amount)) },
      { header: 'Multiplier', accessorKey: 'multiplier' },
      { header: 'Extra', cell: ({ row }) => formatMoney(Number(row.original.extra_amount)) },
      { header: 'Toplam', cell: ({ row }) => formatMoney(Number(row.original.total_amount)) },
      {
        header: 'Aksiyon',
        cell: ({ row }) => (
          <Button
            variant='danger'
            onClick={async () => {
              if (!askConfirm('Prim kaydı silinsin mi?')) return;
              await deleteCommission(row.original.id);
              await refreshAll();
              push('Prim kaydı silindi', 'success');
            }}
          >
            Sil
          </Button>
        )
      }
    ],
    [salesManagers, productManagers, push, refreshAll]
  );

  if (loading) return <LoadingState />;

  return (
    <section className='space-y-4'>
      <h2 className='text-2xl font-black'>Prim Yönetimi</h2>

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        <Card>
          <h3 className='mb-3 text-lg font-bold'>Katsayı Yönetimi</h3>
          <form
            className='grid grid-cols-1 gap-3 md:grid-cols-2'
            onSubmit={coefficientForm.handleSubmit(async (values) => {
              try {
                await upsertCoefficient(values);
                await refreshAll();
                push('Katsayı kaydedildi', 'success');
              } catch {
                push('Katsayı kaydı başarısız', 'error');
              }
            })}
          >
            <Select label='Tip' {...coefficientForm.register('manager_type')}>
              <option value='sales'>Satış</option>
              <option value='product'>Ürün</option>
            </Select>
            <Select label='Yönetici' {...coefficientForm.register('manager_id')}>
              <option value=''>Seçiniz</option>
              {(coefficientForm.watch('manager_type') === 'sales' ? salesManagers : productManagers)
                .filter((m) => m.is_active)
                .map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
            </Select>
            <Input type='number' step='0.01' min={0} max={1} label='Katsayı (0-1)' {...coefficientForm.register('coefficient')} />
            <div className='flex items-end justify-end'>
              <Button type='submit'>Kaydet</Button>
            </div>
          </form>
        </Card>

        <Card>
          <h3 className='mb-3 text-lg font-bold'>Prim Hesapla</h3>
          <form
            className='grid grid-cols-1 gap-3 md:grid-cols-2'
            onSubmit={commissionForm.handleSubmit(async (values) => {
              try {
                await saveCommission({
                  year: values.year,
                  month: values.month,
                  manager_type: values.manager_type,
                  manager_id: values.manager_id,
                  base_amount: base,
                  multiplier: values.multiplier,
                  extra_amount: values.extra_amount,
                  total_amount: total
                });
                await refreshAll();
                push('Prim kaydı oluşturuldu', 'success');
              } catch {
                push('Prim kaydı başarısız', 'error');
              }
            })}
          >
            <Input type='number' label='Yıl' {...commissionForm.register('year')} />
            <Input type='number' min={1} max={12} label='Ay' {...commissionForm.register('month')} />
            <Select label='Tip' {...commissionForm.register('manager_type')}>
              <option value='sales'>Satış</option>
              <option value='product'>Ürün</option>
            </Select>
            <Select label='Yönetici' {...commissionForm.register('manager_id')}>
              <option value=''>Seçiniz</option>
              {managerOptions.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </Select>
            <Input type='number' step='0.01' min={0} label='Multiplier' {...commissionForm.register('multiplier')} />
            <Input type='number' step='0.01' min={0} label='Ek Tutar' {...commissionForm.register('extra_amount')} />

            <div className='md:col-span-2 rounded-xl border border-slate-200 p-3 text-sm'>
              <div>Gerçekleşme: {formatMoney(actualAmount)}</div>
              <div>Katsayı: {coefficient}</div>
              <div>Base Commission: {formatMoney(base)}</div>
              <div>Total: {formatMoney(total)}</div>
            </div>

            <div className='md:col-span-2 flex justify-end'>
              <Button type='submit'>Hesapla ve Kaydet</Button>
            </div>
          </form>
        </Card>
      </div>

      <div className='flex justify-end'>
        <Button
          variant='ghost'
          onClick={() =>
            exportToExcel(
              commissions.map((commission) => ({
                year: commission.year,
                month: commission.month,
                manager_type: commission.manager_type,
                manager_id: commission.manager_id,
                base_amount: commission.base_amount,
                multiplier: commission.multiplier,
                extra_amount: commission.extra_amount,
                total_amount: commission.total_amount
              })),
              'commissions-export'
            )
          }
        >
          Excel Export
        </Button>
      </div>

      <DataTable data={commissions} columns={columns} />
    </section>
  );
}
