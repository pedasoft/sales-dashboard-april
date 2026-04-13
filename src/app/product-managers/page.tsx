'use client';

import { LoadingState } from '@/components/common/LoadingState';
import { ManagerCrudView } from '@/components/forms/ManagerCrudView';
import { useAppStore } from '@/services/useAppStore';

export default function ProductManagersPage() {
  const { loading, productManagers } = useAppStore();
  if (loading) return <LoadingState />;
  return <ManagerCrudView type='product' title='Ürün Yöneticileri' managers={productManagers} />;
}
