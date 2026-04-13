'use client';

import { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { LoadingState } from '@/components/common/LoadingState';
import { useAppStore } from '@/services/useAppStore';
import { deleteTarget, upsertTarget } from '@/services/db';
import { askConfirm } from '@/components/common/Confirm';
import { useToast } from '@/components/common/ToastProvider';
import { downloadTargetTemplate, exportToExcel, parseExcelFile } from '@/utils/excel';
import { MONTHS } from '@/lib/constants';
import { Target } from '@/types/domain';
import { formatMoney } from '@/lib/format';

const MAX_MONTHLY_TARGET = 9_999_999;

function parseSevenDigitCurrency(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 7);
  return digits ? Number(digits) : 0;
}

function formatThousand(value: number) {
  return value > 0 ? value.toLocaleString('tr-TR') : '';
}

export default function TargetsPage() {
  const { loading, targets, salesManagers, productManagers, refreshAll } = useAppStore();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'product'>('all');

  const [draftYear, setDraftYear] = useState(new Date().getFullYear());
  const [draftType, setDraftType] = useState<'sales' | 'product'>('sales');
  const [draftManagerId, setDraftManagerId] = useState('');
  const [monthlyValues, setMonthlyValues] = useState<number[]>(Array.from({ length: 12 }, () => 0));

  const managerOptions = draftType === 'sales' ? salesManagers.filter((m) => m.is_active) : productManagers.filter((m) => m.is_active);

  const rows = useMemo(() => {
    const filtered = targets
      .filter((target) => target.year === filterYear)
      .filter((target) => (filterType === 'all' ? true : target.manager_type === filterType));

    const grouped = new Map<
      string,
      {
        year: number;
        manager_type: 'sales' | 'product';
        manager_id: string;
        manager_name: string;
        annual_target: number;
        monthly_targets: number[];
        target_ids: string[];
      }
    >();

    filtered.forEach((target) => {
      const key = `${target.year}-${target.manager_type}-${target.manager_id}`;
      const manager =
        target.manager_type === 'sales'
          ? salesManagers.find((m) => m.id === target.manager_id)
          : productManagers.find((m) => m.id === target.manager_id);

      const existing = grouped.get(key);
      if (!existing) {
        const monthly = Array.from({ length: 12 }, () => 0);
        monthly[target.month - 1] = Number(target.target_amount);
        grouped.set(key, {
          year: target.year,
          manager_type: target.manager_type,
          manager_id: target.manager_id,
          manager_name: manager?.name ?? 'Bilinmeyen',
          annual_target: Number(target.target_amount),
          monthly_targets: monthly,
          target_ids: [target.id]
        });
        return;
      }

      existing.annual_target += Number(target.target_amount);
      existing.monthly_targets[target.month - 1] = Number(target.target_amount);
      existing.target_ids.push(target.id);
    });

    const consolidated = Array.from(grouped.values());
    if (filterMonth !== 'all') {
      return consolidated.filter((row) => row.monthly_targets[filterMonth - 1] > 0);
    }

    return consolidated;
  }, [targets, filterYear, filterType, filterMonth, salesManagers, productManagers]);

  const existingYearTargets = useMemo(
    () =>
      targets.filter(
        (target) =>
          target.year === draftYear && target.manager_type === draftType && target.manager_id === draftManagerId
      ),
    [targets, draftYear, draftType, draftManagerId]
  );

  useEffect(() => {
    if (!open || !draftManagerId) return;

    const map = new Map<number, number>();
    existingYearTargets.forEach((target) => map.set(target.month, Number(target.target_amount)));

    setMonthlyValues(Array.from({ length: 12 }, (_, idx) => Math.min(map.get(idx + 1) || 0, MAX_MONTHLY_TARGET)));
  }, [open, draftManagerId, existingYearTargets]);

  const yearlyTotal = useMemo(() => monthlyValues.reduce((sum, value) => sum + value, 0), [monthlyValues]);

  const columns = useMemo<
    ColumnDef<{
      year: number;
      manager_type: 'sales' | 'product';
      manager_id: string;
      manager_name: string;
      annual_target: number;
      monthly_targets: number[];
      target_ids: string[];
    }>[]
  >(
    () => [
      { header: 'Yıl', accessorKey: 'year' },
      { header: 'Ay', cell: () => 'Yıllık (12 Ay)' },
      { header: 'Tip', cell: ({ row }) => (row.original.manager_type === 'sales' ? 'Satış' : 'Ürün') },
      { header: 'Yönetici', accessorKey: 'manager_name' },
      {
        header: 'Hedef',
        cell: ({ row }) =>
          Number(row.original.annual_target).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY'
          })
      },
      {
        header: 'Aksiyon',
        cell: ({ row }) => (
          <div className='flex gap-2'>
            <Button
              variant='ghost'
              onClick={() => {
                setDraftYear(row.original.year);
                setDraftType(row.original.manager_type);
                setDraftManagerId(row.original.manager_id);
                setOpen(true);
              }}
            >
              Yıllık Düzenle
            </Button>
            <Button
              variant='danger'
              onClick={async () => {
                if (!askConfirm('Bu yöneticinin seçili yıldaki tüm aylık hedef kayıtları silinsin mi?')) return;
                await Promise.all(row.original.target_ids.map((id) => deleteTarget(id)));
                await refreshAll();
                push('Yıllık hedef silindi', 'success');
              }}
            >
              Sil
            </Button>
          </div>
        )
      }
    ],
    [push, refreshAll]
  );

  const saveYearlyTargets = async () => {
    if (!draftManagerId) {
      push('Yönetici seçiniz', 'error');
      return;
    }

    try {
      for (let month = 1; month <= 12; month++) {
        await upsertTarget({
          year: draftYear,
          month,
          manager_type: draftType,
          manager_id: draftManagerId,
          target_amount: monthlyValues[month - 1] || 0
        });
      }

      await refreshAll();
      push(existingYearTargets.length > 0 ? 'Yıllık hedef güncellendi' : 'Yıllık hedef kaydedildi', 'success');
      setOpen(false);
    } catch {
      push('Hedef kaydı başarısız', 'error');
    }
  };

  const importExcel = async (file: File) => {
    const rows = await parseExcelFile(file);
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const managerType = String(row.manager_type).trim() as 'sales' | 'product';
      const managerName = String(row.manager_name).trim();
      const manager =
        managerType === 'sales'
          ? salesManagers.find((m) => m.name.toLocaleLowerCase('tr-TR') === managerName.toLocaleLowerCase('tr-TR'))
          : productManagers.find((m) => m.name.toLocaleLowerCase('tr-TR') === managerName.toLocaleLowerCase('tr-TR'));

      if (!manager) {
        errors.push(`Satır ${i + 2}: Yönetici bulunamadı (${managerName})`);
        continue;
      }

      try {
        await upsertTarget({
          year: Number(row.year),
          month: Number(row.month),
          manager_type: managerType,
          manager_id: manager.id,
          target_amount: Number(row.target_amount)
        });
        success += 1;
      } catch {
        errors.push(`Satır ${i + 2}: Kayıt işlenemedi`);
      }
    }

    await refreshAll();
    push(`Import tamamlandı. Başarılı: ${success}, Hatalı: ${errors.length}`, errors.length > 0 ? 'info' : 'success');
    if (errors.length > 0) alert(errors.join('\n'));
  };

  if (loading) return <LoadingState />;

  return (
    <section className='space-y-4'>
      <h2 className='text-2xl font-black'>Hedefler</h2>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
        <Input type='number' label='Yıl' value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} />
        <Select label='Ay' value={String(filterMonth)} onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
          <option value='all'>Tümü</option>
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </Select>
        <Select label='Tip' value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'sales' | 'product')}>
          <option value='all'>Tümü</option>
          <option value='sales'>Satış</option>
          <option value='product'>Ürün</option>
        </Select>
        <div className='flex items-end gap-2'>
          <Button
            onClick={() => {
              setDraftYear(new Date().getFullYear());
              setDraftType('sales');
              setDraftManagerId('');
              setMonthlyValues(Array.from({ length: 12 }, () => 0));
              setOpen(true);
            }}
          >
            Yeni Hedef
          </Button>
          <Button variant='secondary' onClick={() => downloadTargetTemplate()}>
            Template İndir
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        <label className='inline-flex cursor-pointer items-center rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white'>
          Excel Import
          <input
            hidden
            type='file'
            accept='.xlsx,.xls'
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await importExcel(file);
              e.target.value = '';
            }}
          />
        </label>
        <Button
          variant='ghost'
          onClick={() =>
            exportToExcel(
              rows.map((row) => ({
                year: row.year,
                manager_type: row.manager_type,
                manager_name: row.manager_name,
                annual_target_amount: row.annual_target,
                jan: row.monthly_targets[0],
                feb: row.monthly_targets[1],
                mar: row.monthly_targets[2],
                apr: row.monthly_targets[3],
                may: row.monthly_targets[4],
                jun: row.monthly_targets[5],
                jul: row.monthly_targets[6],
                aug: row.monthly_targets[7],
                sep: row.monthly_targets[8],
                oct: row.monthly_targets[9],
                nov: row.monthly_targets[10],
                dec: row.monthly_targets[11]
              })),
              'targets-export'
            )
          }
        >
          Excel Export
        </Button>
      </div>

      <DataTable data={rows} columns={columns} />

      <Modal title='Yıllık Hedef Girişi' open={open} onClose={() => setOpen(false)}>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            <Input type='number' label='Yıl' value={draftYear} onChange={(e) => setDraftYear(Number(e.target.value || new Date().getFullYear()))} />
            <Select label='Tip' value={draftType} onChange={(e) => setDraftType(e.target.value as 'sales' | 'product')}>
              <option value='sales'>Satış</option>
              <option value='product'>Ürün</option>
            </Select>
            <Select label='Yönetici' value={draftManagerId} onChange={(e) => setDraftManagerId(e.target.value)}>
              <option value=''>Seçiniz</option>
              {managerOptions.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </Select>
          </div>

          {draftManagerId && existingYearTargets.length > 0 && (
            <div className='rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900'>
              Bu yönetici için {draftYear} yılında mevcut hedef kaydı var. Kaydet işlemi ikinci kayıt oluşturmaz, mevcut yıllık hedefi günceller.
            </div>
          )}

          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            {MONTHS.map((month, idx) => (
              <label key={month} className='block text-sm'>
                <span className='mb-1 block font-medium'>{month} (TL)</span>
                <input
                  className='w-full rounded-xl border border-slate-300 bg-panel px-3 py-2 outline-none ring-primary focus:ring-2'
                  inputMode='numeric'
                  value={formatThousand(monthlyValues[idx])}
                  onChange={(e) => {
                    const amount = Math.min(parseSevenDigitCurrency(e.target.value), MAX_MONTHLY_TARGET);
                    setMonthlyValues((prev) => {
                      const next = [...prev];
                      next[idx] = amount;
                      return next;
                    });
                  }}
                  placeholder='0'
                />
              </label>
            ))}
          </div>

          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-right text-sm'>
            <div className='font-medium text-muted'>Dip Toplam</div>
            <div className='text-2xl font-black'>{formatMoney(yearlyTotal)}</div>
          </div>

          <div className='flex justify-end gap-2'>
            <Button variant='ghost' type='button' onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type='button' onClick={saveYearlyTargets}>
              Kaydet
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
