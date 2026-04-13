import { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <label className='block text-sm'>
      {label && <span className='mb-1 block font-medium'>{label}</span>}
      <select className={clsx('w-full rounded-xl border border-slate-300 bg-panel px-3 py-2 outline-none ring-primary focus:ring-2', className)} {...props}>
        {children}
      </select>
      {error && <span className='mt-1 block text-xs text-danger'>{error}</span>}
    </label>
  );
}
