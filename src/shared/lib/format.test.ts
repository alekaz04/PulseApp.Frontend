import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('format', () => {
  it('formatDate — день.месяц.год', () => {
    expect(formatDate('2026-09-20T10:00:00+00:00')).toBe('20.09.2026');
  });

  it('formatDateTime — дата и время', () => {
    expect(formatDateTime('2026-09-20T10:00:00+00:00')).toMatch(/^20\.09\.2026, \d{2}:\d{2}$/);
  });

  it('невалидная дата — прочерк', () => {
    expect(formatDate('not a date')).toBe('—');
    expect(formatDateTime('')).toBe('—');
  });
});
