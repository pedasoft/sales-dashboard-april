'use client';

import { THEMES } from '@/lib/constants';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/services/useAppStore';

export default function SettingsPage() {
  const { theme, setTheme } = useAppStore();

  return (
    <section className='space-y-4'>
      <h2 className='text-2xl font-black'>Ayarlar</h2>

      <Card className='space-y-4'>
        <h3 className='text-lg font-bold'>Tema Seçimi</h3>
        <div className='grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6'>
          {THEMES.map((themeName) => (
            <Button
              key={themeName}
              variant={theme === themeName ? 'primary' : 'ghost'}
              onClick={() => setTheme(themeName)}
              className='capitalize'
            >
              {themeName}
            </Button>
          ))}
        </div>
      </Card>
    </section>
  );
}
