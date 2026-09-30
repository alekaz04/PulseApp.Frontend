import { describe, expect, it } from 'vitest';
import { NAME_MAX, validateName } from './model';

describe('validateName', () => {
  it('пустое имя и одни пробелы — ошибка', () => {
    expect(validateName('')).toBe('Введите имя');
    expect(validateName('   ')).toBe('Введите имя');
  });

  it('пробелы по краям не считаются', () => {
    expect(validateName(`  ${'a'.repeat(NAME_MAX)}  `)).toBeUndefined();
  });

  it('100 символов — можно, 101 — ошибка', () => {
    expect(validateName('a'.repeat(100))).toBeUndefined();
    expect(validateName('a'.repeat(101))).toBe('Не больше 100 символов');
  });

  // Review Focus 3
  it('эмодзи — один символ: 100 можно, 101 — ошибка', () => {
    expect(validateName('😀'.repeat(100))).toBeUndefined();
    expect(validateName('😀'.repeat(101))).toBe('Не больше 100 символов');
  });
});
