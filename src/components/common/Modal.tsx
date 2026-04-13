import { PropsWithChildren } from 'react';
import { Button } from './Button';

interface ModalProps extends PropsWithChildren {
  title: string;
  open: boolean;
  onClose: () => void;
}

export function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='w-full max-w-2xl rounded-2xl bg-panel p-5 shadow-soft'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-bold'>{title}</h2>
          <Button variant='ghost' onClick={onClose}>
            Kapat
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
