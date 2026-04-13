import { ThemeOption } from '@/types/domain';

export const chartPaletteByTheme: Record<ThemeOption, string[]> = {
  mavi: ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  yesil: ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac'],
  kirmizimsi: ['#881337', '#9f1239', '#be123c', '#e11d48', '#f43f5e', '#fb7185'],
  gradyen: ['#4338ca', '#4f46e5', '#6366f1', '#14b8a6', '#06b6d4', '#22d3ee'],
  gece: ['#0ea5e9', '#38bdf8', '#818cf8', '#22d3ee', '#a78bfa', '#f472b6'],
  gunduz: ['#1f2937', '#334155', '#475569', '#64748b', '#0ea5e9', '#38bdf8']
};
