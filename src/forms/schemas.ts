import { z } from 'zod';
import { PRODUCTS } from '@/lib/constants';

export const managerSchema = z.object({
  name: z.string().min(1, 'İsim zorunlu').max(50, 'Maksimum 50 karakter')
});

export const targetSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
  manager_type: z.enum(['sales', 'product']),
  manager_id: z.string().uuid('Yönetici seçiniz'),
  target_amount: z.coerce.number().min(0, 'Negatif olamaz')
});

export const invoiceSchema = z.object({
  invoice_date: z.string().min(1, 'Fatura tarihi zorunlu'),
  customer_name: z.string().min(1, 'Müşteri adı zorunlu').max(50, 'Maksimum 50 karakter'),
  product: z.enum(PRODUCTS),
  amount: z.coerce.number().min(0, 'Negatif olamaz'),
  sales_manager_id: z.string().uuid('Satış yöneticisi zorunlu'),
  product_manager_id: z.string().uuid('Ürün yöneticisi zorunlu'),
  notes: z.string().optional()
});

export const coefficientSchema = z.object({
  manager_type: z.enum(['sales', 'product']),
  manager_id: z.string().uuid('Yönetici seçiniz'),
  coefficient: z.coerce.number().min(0).max(1)
});

export const commissionSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
  manager_type: z.enum(['sales', 'product']),
  manager_id: z.string().uuid('Yönetici seçiniz'),
  multiplier: z.coerce.number().min(0),
  extra_amount: z.coerce.number().min(0)
});
