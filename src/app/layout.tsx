import './globals.css';
import { PropsWithChildren } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/common/ToastProvider';
import { AppBootstrap } from '@/services/AppBootstrap';
import { ThemeSync } from '@/components/layout/ThemeSync';

export const metadata = {
  title: 'Sales Dashboard Pro',
  description: 'Supabase destekli satış dashboard uygulaması'
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='tr'>
      <body>
        <ToastProvider>
          <AppBootstrap>
            <ThemeSync />
            <AppShell>{children}</AppShell>
          </AppBootstrap>
        </ToastProvider>
      </body>
    </html>
  );
}
