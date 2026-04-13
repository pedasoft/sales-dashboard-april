import { PropsWithChildren } from 'react';
import clsx from 'clsx';

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={clsx('rounded-2xl border border-slate-200 bg-panel p-4 shadow-soft', className)}>{children}</div>;
}
