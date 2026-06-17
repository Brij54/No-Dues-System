export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseUTCDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  let parsed = dateStr;
  if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.endsWith('z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)) {
    parsed = dateStr + 'Z';
  }
  return new Date(parsed);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return parseUTCDate(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  return parseUTCDate(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function statusColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === 'cleared' || s === 'approved' || s === 'active' || s === 'success' || s === 'no_dues') return 'emerald';
  if (s === 'pending' || s === 'review' || s === 'provisional' || s === 'dues_pending') return 'amber';
  if (s === 'overdue' || s === 'failed' || s === 'rejected' || s === 'inactive') return 'red';
  return 'slate';
}
