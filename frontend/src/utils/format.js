const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function formatCurrency(value) {
  const n = Number(value) || 0;
  return currencyFormatter.format(n);
}

export function formatCurrencyCompact(value) {
  const n = Number(value) || 0;
  return compactCurrencyFormatter.format(n);
}

export function formatInt(value) {
  const n = Number(value) || 0;
  return integerFormatter.format(n);
}

export function formatDecimal(value) {
  const n = Number(value) || 0;
  return decimalFormatter.format(n);
}

export function formatPercent(value) {
  const n = Number(value) || 0;
  return `${percentFormatter.format(n)}%`;
}

export function formatDateBR(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatDateShort(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}
