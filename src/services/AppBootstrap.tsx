'use client';

import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { AppStoreContext } from './useAppStore';
import { Coefficient, Commission, Invoice, ProductManager, SalesManager, Target, ThemeOption } from '@/types/domain';
import {
  getCoefficients,
  getCommissions,
  getInvoices,
  getProductManagers,
  getSalesManagers,
  getTargets,
  getUiSettings,
  saveTheme
} from './db';
import { useToast } from '@/components/common/ToastProvider';

export function AppBootstrap({ children }: PropsWithChildren) {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemeOption>('mavi');
  const [salesManagers, setSalesManagers] = useState<SalesManager[]>([]);
  const [productManagers, setProductManagers] = useState<ProductManager[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [coefficients, setCoefficients] = useState<Coefficient[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sales, products, targetsData, invoicesData, coefficientData, commissionData, settings] = await Promise.all([
        getSalesManagers(),
        getProductManagers(),
        getTargets(),
        getInvoices(),
        getCoefficients(),
        getCommissions(),
        getUiSettings()
      ]);

      setSalesManagers(sales);
      setProductManagers(products);
      setTargets(targetsData);
      setInvoices(invoicesData as Invoice[]);
      setCoefficients(coefficientData);
      setCommissions(commissionData);
      setThemeState((settings?.theme as ThemeOption) || 'mavi');
    } catch (error) {
      console.error(error);
      push('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [push]);

  const setTheme = useCallback(
    async (nextTheme: ThemeOption) => {
      try {
        await saveTheme(nextTheme);
        setThemeState(nextTheme);
        push('Tema güncellendi', 'success');
      } catch (error) {
        console.error(error);
        push('Tema kaydedilemedi', 'error');
      }
    },
    [push]
  );

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const value = useMemo(
    () => ({
      loading,
      salesManagers,
      productManagers,
      targets,
      invoices,
      coefficients,
      commissions,
      theme,
      refreshAll,
      setTheme
    }),
    [loading, salesManagers, productManagers, targets, invoices, coefficients, commissions, theme, refreshAll, setTheme]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}
