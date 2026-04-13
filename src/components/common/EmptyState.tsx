export function EmptyState({ title = 'Kayıt bulunamadı' }: { title?: string }) {
  return <div className='rounded-xl border border-dashed border-slate-300 p-6 text-center text-muted'>{title}</div>;
}
