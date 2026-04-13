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
import { invoiceSchema } from '@/forms/schemas';
import { deleteInvoice, upsertInvoice } from '@/services/db';
import { askConfirm } from '@/components/common/Confirm';
import { useToast } from '@/components/common/ToastProvider';
import { exportToExcel } from '@/utils/excel';
import { PRODUCTS } from '@/lib/constants';
import { formatMoney } from '@/lib/format';
import { Invoice } from '@/types/domain';

export default function InvoicesPage() {
  const { loading, invoices, salesManagers, productManagers, refreshAll } = useAppStore();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | 'all'>('all');
  const [product, setProduct] = useState<string>('all');
  const [salesManagerId, setSalesManagerId] = useState<string>('all');
  const [productManagerId, setProductManagerId] = useState<string>('all');
  const [customer, setCustomer] = useState('');

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().slice(0, 10),
      customer_name: '',
      product: 'bEAM',
      amount: 0,
      sales_manager_id: '',
      product_manager_id: '',
      notes: ''
    }
  });

  const rows = useMemo(() => {
    return invoices
      .filter((inv) => new Date(inv.invoice_date).getFullYear() === year)
      .filter((inv) => (month === 'all' ? true : new Date(inv.invoice_date).getMonth() + 1 === month))
      .filter((inv) => (product === 'all' ? true : inv.product === product))
      .filter((inv) => (salesManagerId === 'all' ? true : inv.sales_manager_id === salesManagerId))
      .filter((inv) => (productManagerId === 'all' ? true : inv.product_manager_id === productManagerId))
      .filter((inv) => inv.customer_name.toLocaleLowerCase('tr-TR').includes(customer.toLocaleLowerCase('tr-TR')))
      .map((inv) => ({
        ...inv,
        sales_manager_name: salesManagers.find((m) => m.id === inv.sales_manager_id)?.name ?? 'Bilinmeyen',
        product_manager_name: productManagers.find((m) => m.id === inv.product_manager_id)?.name ?? 'Bilinmeyen'
      }));
  }, [invoices, year, month, product, salesManagerId, productManagerId, customer, salesManagers, productManagers]);

  const columns = useMemo<ColumnDef<(Invoice & { sales_manager_name: string; product_manager_name: string })>[]>(
    () => [
      { header: 'Fatura Tarihi', cell: ({ row }) => new Date(row.original.invoice_date).toLocaleDateString('tr-TR') },
      { header: 'Müşteri', accessorKey: 'customer_name' },
      { header: 'Ürün', accessorKey: 'product' },
      { header: 'Tutar', cell: ({ row }) => formatMoney(Number(row.original.amount)) },
      { header: 'Satış Yöneticisi', accessorKey: 'sales_manager_name' },
      { header: 'Ürün Yöneticisi', accessorKey: 'product_manager_name' },
      {
        header: 'Aksiyon',
        cell: ({ row }) => (
          <div className='flex gap-2'>
            <Button
              variant='ghost'
              onClick={() => {
                setEditing(row.original);
                form.reset({
                  invoice_date: row.original.invoice_date,
                  customer_name: row.original.customer_name,
                  product: row.original.product,
                  amount: row.original.amount,
                  sales_manager_id: row.original.sales_manager_id,
                  product_manager_id: row.original.product_manager_id,
                  notes: row.original.notes ?? ''
                });
                setOpen(true);
              }}
            >
              Düzenle
            </Button>
            <Button
              variant='danger'
              onClick={async () => {
                if (!askConfirm('Fatura silinsin mi?')) return;
                await deleteInvoice(row.original.id);
                await refreshAll();
                push('Fatura silindi', 'success');
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
      await upsertInvoice({
        id: editing?.id,
        invoice_date: values.invoice_date,
        customer_name: values.customer_name,
        product: values.product,
        amount: values.amount,
        sales_manager_id: values.sales_manager_id,
        product_manager_id: values.product_manager_id,
        notes: values.notes || null
      });
      await refreshAll();
      push('Fatura kaydedildi', 'success');
      setOpen(false);
      setEditing(null);
      form.reset();
    } catch {
      push('Fatura kaydı başarısız', 'error');
    }
  });

  if (loading) return <LoadingState />;

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-2xl font-black'>Faturalar</h2>
        <Button onClick={() => setOpen(true)}>Yeni Fatura</Button>
      </div>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6'>
        <Input type='number' label='Yıl' value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <Input type='number' label='Ay' value={month === 'all' ? '' : month} placeholder='Tümü' onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : 'all')} />
        <Select label='Ürün' value={product} onChange={(e) => setProduct(e.target.value)}>
          <option value='all'>Tümü</option>
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select label='Satış Yöneticisi' value={salesManagerId} onChange={(e) => setSalesManagerId(e.target.value)}>
          <option value='all'>Tümü</option>
          {salesManagers
            .filter((m) => m.is_active)
            .map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
        </Select>
        <Select label='Ürün Yöneticisi' value={productManagerId} onChange={(e) => setProductManagerId(e.target.value)}>
          <option value='all'>Tümü</option>
          {productManagers
            .filter((m) => m.is_active)
            .map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
        </Select>
        <Input label='Müşteri Ara' value={customer} onChange={(e) => setCustomer(e.target.value)} />
      </div>

      <div>
        <Button
          variant='ghost'
          onClick={() =>
            exportToExcel(
              rows.map((row) => ({
                invoice_date: row.invoice_date,
                customer_name: row.customer_name,
                product: row.product,
                amount: row.amount,
                sales_manager: row.sales_manager_name,
                product_manager: row.product_manager_name
              })),
              'invoices-export'
            )
          }
        >
          Excel Export
        </Button>
      </div>

      <DataTable data={rows} columns={columns} />

      <Modal title={editing ? 'Fatura Düzenle' : 'Yeni Fatura'} open={open} onClose={() => setOpen(false)}>
        <form className='grid grid-cols-1 gap-3 md:grid-cols-2' onSubmit={save}>
          <Input type='date' label='Fatura Tarihi' {...form.register('invoice_date')} error={form.formState.errors.invoice_date?.message} />
          <Input label='Müşteri' maxLength={50} {...form.register('customer_name')} error={form.formState.errors.customer_name?.message} />
          <Select label='Ürün' {...form.register('product')} error={form.formState.errors.product?.message}>
            {PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input type='number' min={0} label='Tutar (TRY)' {...form.register('amount')} error={form.formState.errors.amount?.message} />
          <Select label='Satış Yöneticisi' {...form.register('sales_manager_id')} error={form.formState.errors.sales_manager_id?.message}>
            <option value=''>Seçiniz</option>
            {salesManagers
              .filter((m) => m.is_active)
              .map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
          </Select>
          <Select label='Ürün Yöneticisi' {...form.register('product_manager_id')} error={form.formState.errors.product_manager_id?.message}>
            <option value=''>Seçiniz</option>
            {productManagers
              .filter((m) => m.is_active)
              .map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
          </Select>
          <Input className='md:col-span-2' label='Notlar' {...form.register('notes')} />
          <div className='md:col-span-2 flex justify-end gap-2'>
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
