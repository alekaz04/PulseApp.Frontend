import { describe, expect, it } from 'vitest';
import { parseBulk } from './parseBulk';

describe('parseBulk', () => {
  it('каждая непустая строка — отдельный комплимент с общим заголовком', () => {
    expect(parseBulk(' Утро ', 'Ты лучше всех\nТы умница')).toEqual({
      ok: true,
      items: [
        { title: 'Утро', text: 'Ты лучше всех' },
        { title: 'Утро', text: 'Ты умница' },
      ],
    });
  });

  // Review Focus 4
  it('текст из Windows/Word: \\r\\n, пустые и пробельные строки, пробелы по краям', () => {
    expect(parseBulk('Утро', '  Первый  \r\n\r\n   \r\nВторой\r\n')).toEqual({
      ok: true,
      items: [
        { title: 'Утро', text: 'Первый' },
        { title: 'Утро', text: 'Второй' },
      ],
    });
  });

  it('номер слишком длинной строки — по исходному тексту', () => {
    expect(parseBulk('Утро', `Первый\n\n${'а'.repeat(501)}`)).toEqual({
      ok: false,
      error: 'Строка 3 длиннее 500 символов',
    });
  });

  it('строка из 500 эмодзи допустима', () => {
    const result = parseBulk('Утро', '😀'.repeat(500));
    expect(result.ok).toBe(true);
  });

  it('пустой список', () => {
    expect(parseBulk('Утро', '\n  \n')).toEqual({ ok: false, error: 'Добавьте хотя бы одну строку' });
  });

  it('пустой заголовок', () => {
    expect(parseBulk('  ', 'Текст')).toEqual({ ok: false, error: 'Введите заголовок' });
  });

  it('длинный заголовок', () => {
    expect(parseBulk('a'.repeat(101), 'Текст')).toEqual({ ok: false, error: 'Заголовок длиннее 100 символов' });
  });
});
