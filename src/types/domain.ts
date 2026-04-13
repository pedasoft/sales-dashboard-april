export type ManagerType = 'sales' | 'product';

export type ProductEnum = 'bEAM' | 'bEAM Cloud' | 'QDMS' | 'Synergy CSP' | 'eBA Plus' | 'Ensemble';

export type ThemeOption = 'mavi' | 'yesil' | 'kirmizimsi' | 'gradyen' | 'gece' | 'gunduz';

export interface BaseManager {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export type SalesManager = BaseManager;
export type ProductManager = BaseManager;

export interface Target {
  id: string;
  year: number;
  month: number;
  manager_type: ManagerType;
  manager_id: string;
  target_amount: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_date: string;
  customer_name: string;
  product: ProductEnum;
  amount: number;
  sales_manager_id: string;
  product_manager_id: string;
  notes: string | null;
  created_at: string;
}

export interface Coefficient {
  id: string;
  manager_type: ManagerType;
  manager_id: string;
  coefficient: number;
  created_at: string;
}

export interface Commission {
  id: string;
  year: number;
  month: number;
  manager_type: ManagerType;
  manager_id: string;
  base_amount: number;
  multiplier: number;
  extra_amount: number;
  total_amount: number;
  created_at: string;
}

export interface UiSettings {
  id: string;
  theme: ThemeOption;
  created_at: string;
}

export interface KPIData {
  totalTarget: number;
  totalActual: number;
  successRate: number;
  totalInvoices: number;
  avgInvoiceAmount: number;
}
