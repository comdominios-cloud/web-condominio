const MONEY = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

const NUMBER = new Intl.NumberFormat('es-PE');

export function pick(source, keys, fallback = null) {
  if (!source || typeof source !== 'object') return fallback;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return fallback;
}

export function money(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '—';

  return MONEY.format(amount);
}

export function number(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '—';

  return NUMBER.format(amount);
}

export function percent(value, digits = 1) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '—';

  const normalized = amount > 0 && amount <= 1 ? amount * 100 : amount;

  return `${normalized.toFixed(digits)}%`;
}

export function date(value) {
  if (!value) return '—';

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function dateTime(value) {
  if (!value) return '—';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function text(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;

  if (typeof value === 'object') return JSON.stringify(value);

  return String(value);
}

export function initials(name) {
  const clean = String(name || '').trim();

  if (!clean) return 'CN';

  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function matches(record, term) {
  if (!term) return true;

  const needle = term.toLowerCase().trim();

  return JSON.stringify(record ?? '')
    .toLowerCase()
    .includes(needle);
}
