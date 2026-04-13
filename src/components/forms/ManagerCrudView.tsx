'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseManager, ManagerType } from '@/types/domain';
import { managerSchema } from '@/forms/schemas';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { askConfirm } from '@/components/common/Confirm';
import { useToast } from '@/components/common/ToastProvider';
import { deactivateManager, saveProductManager, saveSalesManager } from '@/services/db';
import { useAppStore } from '@/services/useAppStore';

interface ManagerCrudViewProps {
  type: ManagerType;
  title: string;
  managers: BaseManager[];
}

export function ManagerCrudView({ type, title, managers }: ManagerCrudViewProps) {
  const { refreshAll } = useAppStore();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BaseManager | null>(null);

  const form = useForm<z.infer<typeof managerSchema>>({
    resolver: zodResolver(managerSchema),
    defaultValues: { name: '' }
  });

  const columns = useMemo<ColumnDef<BaseManager>[]>(
    () => [
      { header: 'İsim', accessorKey: 'name' },
      {
        header: 'Aktiflik',
        cell: ({ row }) => (
          <span className={row.original.is_active ? 'text-positive' : 'text-danger'}>{row.original.is_active ? 'Aktif' : 'Pasif'}</span>
        )
      },
      {
        header: 'Oluşturma',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('tr-TR')
      },
      {
        header: 'Aksiyonlar',
        cell: ({ row }) => (
          <div className='flex gap-2'>
            <Button
              variant='ghost'
              onClick={() => {
                setEditing(row.original);
                form.reset({ name: row.original.name });
                setOpen(true);
              }}
            >
              Düzenle
            </Button>
            <Button
              variant='danger'
              onClick={async () => {
                if (!askConfirm('Kayıt pasife alınsın mı?')) return;
                try {
                  await deactivateManager(type, row.original.id);
                  await refreshAll();
                  push('Kayıt pasife alındı', 'success');
                } catch {
                  push('İşlem başarısız', 'error');
                }
              }}
            >
              Pasife Al
            </Button>
          </div>
        )
      }
    ],
    [form, push, refreshAll, type]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (type === 'sales') {
        await saveSalesManager({ id: editing?.id, name: values.name });
      } else {
        await saveProductManager({ id: editing?.id, name: values.name });
      }

      await refreshAll();
      push('Kayıt kaydedildi', 'success');
      setOpen(false);
      setEditing(null);
      form.reset({ name: '' });
    } catch {
      push('Kayıt sırasında hata oluştu', 'error');
    }
  });

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-2xl font-black'>{title}</h2>
        <Button
          onClick={() => {
            setEditing(null);
            form.reset({ name: '' });
            setOpen(true);
          }}
        >
          Yeni Ekle
        </Button>
      </div>

      <DataTable data={managers} columns={columns} />

      <Modal title={editing ? 'Yönetici Düzenle' : 'Yeni Yönetici'} open={open} onClose={() => setOpen(false)}>
        <form className='space-y-3' onSubmit={onSubmit}>
          <Input label='Yönetici Adı' maxLength={50} {...form.register('name')} error={form.formState.errors.name?.message} />
          <div className='flex justify-end gap-2'>
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
