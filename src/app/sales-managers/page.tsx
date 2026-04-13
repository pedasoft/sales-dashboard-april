'use client';

import { LoadingState } from '@/components/common/LoadingState';
import { ManagerCrudView } from '@/components/forms/ManagerCrudView';
import { useAppStore } from '@/services/useAppStore';

export default function SalesManagersPage() {
  const { loading, salesManagers } = useAppStore();
  if (loading) return <LoadingState />;
  return <ManagerCrudView type='sales' title='Satış Yöneticileri' managers={salesManagers} />;
}
