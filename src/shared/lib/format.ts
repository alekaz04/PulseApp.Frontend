const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(iso: string): string {
  const date = parse(iso);
  return date ? dateFormat.format(date) : '—';
}

export function formatDateTime(iso: string): string {
  const date = parse(iso);
  return date ? dateTimeFormat.format(date) : '—';
}
