const currencyFormatter = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Q 0.00';
  }

  return currencyFormatter
    .format(value)
    .replace('GTQ', 'Q')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateFormatter.format(date);
}

export function getGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
