'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/services/useAppStore';

export function ThemeSync() {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}
