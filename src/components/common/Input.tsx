import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className='block text-sm'>
      {label && <span className='mb-1 block font-medium'>{label}</span>}
      <input className={clsx('w-full rounded-xl border border-slate-300 bg-panel px-3 py-2 outline-none ring-primary focus:ring-2', className)} {...props} />
      {error && <span className='mt-1 block text-xs text-danger'>{error}</span>}
    </label>
  );
}
