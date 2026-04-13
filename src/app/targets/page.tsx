'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { LoadingState } from '@/components/common/LoadingState';
import { useAppStore } from '@/services/useAppStore';
import { targetSchema } from '@/forms/schemas';
import { deleteTarget, upsertTarget } from '@/services/db';
import { askConfirm } from '@/components/common/Confirm';
import { useToast } from '@/components/common/ToastProvider';
import { downloadTargetTemplate, exportToExcel, parseExcelFile } from '@/utils/excel';
import { MONTHS } from '@/lib/constants';
import { Target } from '@/types/domain';

export default function TargetsPage() {
  const { loading, targets, salesManagers, productManagers, refreshAll } = useAppStore();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Target | null>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'product'>('all');

  const form = useForm<z.infer<typeof targetSchema>>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      manager_type: 'sales',
      manager_id: '',
      target_amount: 0
    }
  });

  const managerOptions = form.watch('manager_type') === 'sales' ? salesManagers.filter((m) => m.is_active) : productManagers.filter((m) => m.is_active);

  const rows = useMemo(
    () =>
      targets
        .filter((target) => target.year === filterYear)
        .filter((target) => (filterMonth === 'all' ? true : target.month === filterMonth))
        .filter((target) => (filterType === 'all' ? true : target.manager_type === filterType))
        .map((target) => {
          const manager = target.manager_type === 'sales' ? salesManagers.find((m) => m.id === target.manager_id) : productManagers.find((m) => m.id === target.manager_id);
          return {
            ...target,
            manager_name: manager?.name ?? 'Bilinmeyen'
          };
        }),
    [targets, filterYear, filterMonth, filterType, salesManagers, productManagers]
  );

  const columns = useMemo<ColumnDef<(Target & { manager_name: string })>[]>(
    () => [
      { header: 'Yıl', accessorKey: 'year' },
      { header: 'Ay', cell: ({ row }) => MONTHS[row.original.month - 1] },
      { header: 'Tip', cell: ({ row }) => (row.original.manager_type === 'sales' ? 'Satış' : 'Ürün') },
      { header: 'Yönetici', accessorKey: 'manager_name' },
      {
        header: 'Hedef',
        cell: ({ row }) =>
          Number(row.original.target_amount).toLocaleString('tr-TR', {
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
                setEditing(row.original);
                form.reset({
                  year: row.original.year,
                  month: row.original.month,
                  manager_type: row.original.manager_type,
                  manager_id: row.original.manager_id,
                  target_amount: row.original.target_amount
                });
                setOpen(true);
              }}
            >
              Düzenle
            </Button>
            <Button
              variant='danger'
              onClick={async () => {
                if (!askConfirm('Kayıt silinsin mi?')) return;
                await deleteTarget(row.original.id);
                await refreshAll();
                push('Hedef silindi', 'success');
              }}
            >
              Sil
            </Button>
          </div>
        )
      }
    ],
    [form, push, refreshAll]
  );

  const save = form.handleSubmit(async (values) => {
    try {
      await upsertTarget({
        id: editing?.id,
        year: values.year,
        month: values.month,
        manager_type: values.manager_type,
        manager_id: values.manager_id,
        target_amount: values.target_amount
      });
      await refreshAll();
      push('Hedef kaydedildi', 'success');
      setOpen(false);
      setEditing(null);
    } catch {
      push('Kayıt başarısız', 'error');
    }
  });

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
          <Button onClick={() => setOpen(true)}>Yeni Hedef</Button>
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
                month: row.month,
                manager_type: row.manager_type,
                manager_name: row.manager_name,
                target_amount: row.target_amount
              })),
              'targets-export'
            )
          }
        >
          Excel Export
        </Button>
      </div>

      <DataTable data={rows} columns={columns} />

      <Modal title={editing ? 'Hedef Düzenle' : 'Yeni Hedef'} open={open} onClose={() => setOpen(false)}>
        <form className='grid grid-cols-1 gap-3 md:grid-cols-2' onSubmit={save}>
          <Input type='number' label='Yıl' {...form.register('year')} error={form.formState.errors.year?.message} />
          <Input type='number' min={1} max={12} label='Ay' {...form.register('month')} error={form.formState.errors.month?.message} />
          <Select label='Tip' {...form.register('manager_type')} error={form.formState.errors.manager_type?.message}>
            <option value='sales'>Satış</option>
            <option value='product'>Ürün</option>
          </Select>
          <Select label='Yönetici' {...form.register('manager_id')} error={form.formState.errors.manager_id?.message}>
            <option value=''>Seçiniz</option>
            {managerOptions.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </Select>
          <Input type='number' label='Hedef Tutarı' {...form.register('target_amount')} error={form.formState.errors.target_amount?.message} />
          <div className='flex items-end justify-end gap-2'>
            <Button variant='ghost' type='button' onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type='submit'>Kaydet</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
