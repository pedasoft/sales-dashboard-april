export const moneyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

export const numberFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 2
});

export const formatMoney = (amount: number) => moneyFormatter.format(amount || 0);

export const formatPercent = (value: number) => `${numberFormatter.format(value || 0)}%`;

export const parseNumericInput = (value: string) => {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return Number(normalized || 0);
};
