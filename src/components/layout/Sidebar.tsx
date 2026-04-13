'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const menu = [
  { href: '/sales-managers', label: 'Satış Yöneticileri' },
  { href: '/product-managers', label: 'Ürün Yöneticileri' },
  { href: '/targets', label: 'Hedefler' },
  { href: '/invoices', label: 'Faturalar' },
  { href: '/general-dashboard', label: 'Genel Dashboard' },
  { href: '/personal-dashboard', label: 'Kişisel Dashboard' },
  { href: '/commissions', label: 'Prim Yönetimi' },
  { href: '/settings', label: 'Ayarlar' }
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className='w-full rounded-2xl border border-slate-200 bg-panel p-3 lg:w-72'>
      <h1 className='px-2 py-3 text-lg font-black tracking-tight'>Sales Dashboard Pro</h1>
      <nav className='space-y-1'>
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx('block rounded-xl px-3 py-2 text-sm font-semibold transition',
              pathname === item.href ? 'bg-primary text-white' : 'text-text hover:bg-slate-100')}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
