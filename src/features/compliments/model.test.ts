import { describe, expect, it } from 'vitest';
import type { ComplimentDto } from '../../shared/api/types';
import { charCount, hasErrors, sortByNewest, sortForSending, validateCompliment } from './model';

describe('charCount', () => {
  it('эмодзи — один символ', () => {
    expect('😀'.length).toBe(2);
    expect(charCount('😀')).toBe(1);
  });
});

describe('validateCompliment', () => {
  it('пустые поля — обе ошибки', () => {
    expect(validateCompliment({ title: '  ', text: '' })).toEqual({
      title: 'Введите заголовок',
      text: 'Введите текст',
    });
  });

  it('длинный заголовок', () => {
    expect(validateCompliment({ title: 'a'.repeat(101), text: 'ok' })).toEqual({ title: 'Не больше 100 символов' });
  });

  // Review Focus 5
  it('500 эмодзи — допустимо, 501 — ошибка', () => {
    expect(validateCompliment({ title: 'ok', text: '😀'.repeat(500) })).toEqual({});
    expect(validateCompliment({ title: 'ok', text: '😀'.repeat(501) })).toEqual({ text: 'Не больше 500 символов' });
  });

  it('hasErrors', () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ text: 'x' })).toBe(true);
  });
});

describe('sortByNewest', () => {
  it('новые сверху, исходный массив не меняется', () => {
    const list = [
      { id: 'old', createdAt: '2026-09-01T10:00:00+00:00' },
      { id: 'new', createdAt: '2026-09-10T10:00:00+00:00' },
    ] as ComplimentDto[];

    expect(sortByNewest(list).map((c) => c.id)).toEqual(['new', 'old']);
    expect(list.map((c) => c.id)).toEqual(['old', 'new']);
  });
});

describe('sortForSending', () => {
  it('сначала неотправленные, затем отправленные, внутри — новые сверху; исходный массив не меняется', () => {
    const list = [
      { id: 'sent-new', isBeenPushed: true, createdAt: '2026-09-20T10:00:00+00:00' },
      { id: 'queued-old', isBeenPushed: false, createdAt: '2026-09-01T10:00:00+00:00' },
      { id: 'sent-old', isBeenPushed: true, createdAt: '2026-09-02T10:00:00+00:00' },
      { id: 'queued-new', isBeenPushed: false, createdAt: '2026-09-10T10:00:00+00:00' },
    ] as ComplimentDto[];

    expect(sortForSending(list).map((c) => c.id)).toEqual(['queued-new', 'queued-old', 'sent-new', 'sent-old']);
    expect(list.map((c) => c.id)).toEqual(['sent-new', 'queued-old', 'sent-old', 'queued-new']);
  });
});
