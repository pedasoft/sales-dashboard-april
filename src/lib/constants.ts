import { ProductEnum, ThemeOption } from '@/types/domain';

export const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık'
];

export const PRODUCTS: ProductEnum[] = ['bEAM', 'bEAM Cloud', 'QDMS', 'Synergy CSP', 'eBA Plus', 'Ensemble'];

export const THEMES: ThemeOption[] = ['mavi', 'yesil', 'kirmizimsi', 'gradyen', 'gece', 'gunduz'];

export const MANAGER_TYPES = [
  { label: 'Satış', value: 'sales' },
  { label: 'Ürün', value: 'product' }
] as const;
