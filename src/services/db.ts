import { supabase } from '@/lib/supabase';
import {
  Coefficient,
  Commission,
  Invoice,
  ManagerType,
  ProductManager,
  SalesManager,
  Target,
  ThemeOption,
  UiSettings
} from '@/types/domain';

export async function getSalesManagers() {
  const { data, error } = await supabase.from('sales_managers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SalesManager[];
}

export async function getProductManagers() {
  const { data, error } = await supabase.from('product_managers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductManager[];
}

export async function saveSalesManager(payload: Partial<SalesManager>) {
  if (payload.id) {
    const { error } = await supabase.from('sales_managers').update({ name: payload.name }).eq('id', payload.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('sales_managers').insert({ name: payload.name });
  if (error) throw error;
}

export async function saveProductManager(payload: Partial<ProductManager>) {
  if (payload.id) {
    const { error } = await supabase.from('product_managers').update({ name: payload.name }).eq('id', payload.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('product_managers').insert({ name: payload.name });
  if (error) throw error;
}

export async function deactivateManager(type: ManagerType, id: string) {
  const table = type === 'sales' ? 'sales_managers' : 'product_managers';
  const { error } = await supabase.from(table).update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function getTargets(year?: number, month?: number, managerType?: ManagerType) {
  let query = supabase.from('targets').select('*').order('year', { ascending: false }).order('month', { ascending: false });
  if (year) query = query.eq('year', year);
  if (month) query = query.eq('month', month);
  if (managerType) query = query.eq('manager_type', managerType);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Target[];
}

export async function upsertTarget(payload: Omit<Target, 'id' | 'created_at'> & { id?: string }) {
  if (payload.id) {
    const { error } = await supabase
      .from('targets')
      .update({ year: payload.year, month: payload.month, manager_type: payload.manager_type, manager_id: payload.manager_id, target_amount: payload.target_amount })
      .eq('id', payload.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('targets').upsert(payload, { onConflict: 'year,month,manager_type,manager_id' });
  if (error) throw error;
}

export async function deleteTarget(id: string) {
  const { error } = await supabase.from('targets').delete().eq('id', id);
  if (error) throw error;
}

export interface InvoiceFilters {
  year?: number;
  month?: number;
  product?: string;
  salesManagerId?: string;
  productManagerId?: string;
  customer?: string;
}

export async function getInvoices(filters: InvoiceFilters = {}) {
  let query = supabase
    .from('invoices')
    .select('*, sales_manager:sales_managers!invoices_sales_manager_id_fkey(name), product_manager:product_managers!invoices_product_manager_id_fkey(name)')
    .order('invoice_date', { ascending: false });

  if (filters.year) {
    query = query.gte('invoice_date', `${filters.year}-01-01`).lte('invoice_date', `${filters.year}-12-31`);
  }

  if (filters.month && filters.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
    const endDate = new Date(filters.year, filters.month, 0).getDate();
    const end = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(endDate).padStart(2, '0')}`;
    query = query.gte('invoice_date', start).lte('invoice_date', end);
  }

  if (filters.product) query = query.eq('product', filters.product);
  if (filters.salesManagerId) query = query.eq('sales_manager_id', filters.salesManagerId);
  if (filters.productManagerId) query = query.eq('product_manager_id', filters.productManagerId);
  if (filters.customer) query = query.ilike('customer_name', `%${filters.customer}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as (Invoice & { sales_manager?: { name: string }; product_manager?: { name: string } })[];
}

export async function upsertInvoice(payload: Omit<Invoice, 'id' | 'created_at'> & { id?: string }) {
  if (payload.id) {
    const { error } = await supabase
      .from('invoices')
      .update({
        invoice_date: payload.invoice_date,
        customer_name: payload.customer_name,
        product: payload.product,
        amount: payload.amount,
        sales_manager_id: payload.sales_manager_id,
        product_manager_id: payload.product_manager_id,
        notes: payload.notes
      })
      .eq('id', payload.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('invoices').insert(payload);
  if (error) throw error;
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}

export async function getCoefficients() {
  const { data, error } = await supabase.from('coefficients').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Coefficient[];
}

export async function upsertCoefficient(payload: Omit<Coefficient, 'id' | 'created_at'>) {
  const { error } = await supabase.from('coefficients').upsert(payload, { onConflict: 'manager_type,manager_id' });
  if (error) throw error;
}

export async function getCommissions() {
  const { data, error } = await supabase.from('commissions').select('*').order('year', { ascending: false }).order('month', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Commission[];
}

export async function saveCommission(payload: Omit<Commission, 'id' | 'created_at'>) {
  const { error } = await supabase.from('commissions').insert(payload);
  if (error) throw error;
}

export async function deleteCommission(id: string) {
  const { error } = await supabase.from('commissions').delete().eq('id', id);
  if (error) throw error;
}

export async function getUiSettings() {
  const { data, error } = await supabase.from('ui_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data as UiSettings | null;
}

export async function saveTheme(theme: ThemeOption) {
  const current = await getUiSettings();
  if (current?.id) {
    const { error } = await supabase.from('ui_settings').update({ theme }).eq('id', current.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('ui_settings').insert({ theme });
  if (error) throw error;
}
