'use client';

import { createContext, useContext } from 'react';
import {
  Coefficient,
  Commission,
  Invoice,
  ProductManager,
  SalesManager,
  Target,
  ThemeOption
} from '@/types/domain';

export interface AppStoreState {
  loading: boolean;
  salesManagers: SalesManager[];
  productManagers: ProductManager[];
  targets: Target[];
  invoices: Invoice[];
  coefficients: Coefficient[];
  commissions: Commission[];
  theme: ThemeOption;
  refreshAll: () => Promise<void>;
  setTheme: (theme: ThemeOption) => Promise<void>;
}

export const AppStoreContext = createContext<AppStoreState | null>(null);

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppBootstrap');
  return ctx;
}
