'use client';

import { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className='bg-atmosphere min-h-screen p-3 lg:p-6'>
      <div className='mx-auto flex max-w-[1700px] flex-col gap-3 lg:flex-row lg:gap-6'>
        <Sidebar />
        <main className='flex-1 rounded-2xl border border-slate-200 bg-panel p-4 lg:p-6'>{children}</main>
      </div>
    </div>
  );
}
