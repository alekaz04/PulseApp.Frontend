import type { ComplimentDto, ComplimentInput } from '../../shared/api/types';

export const TITLE_MAX = 100;
export const TEXT_MAX = 500;

/**
 * Длина в символах (кодовых точках), как её считает varchar в Postgres: эмодзи — один символ.
 */
export function charCount(value: string): number {
  return Array.from(value).length;
}

export type ComplimentErrors = {
  title?: string;
  text?: string;
};

export function validateCompliment(input: ComplimentInput): ComplimentErrors {
  const errors: ComplimentErrors = {};
  const title = input.title.trim();
  const text = input.text.trim();

  if (!title) {
    errors.title = 'Введите заголовок';
  } else if (charCount(title) > TITLE_MAX) {
    errors.title = `Не больше ${TITLE_MAX} символов`;
  }

  if (!text) {
    errors.text = 'Введите текст';
  } else if (charCount(text) > TEXT_MAX) {
    errors.text = `Не больше ${TEXT_MAX} символов`;
  }

  return errors;
}

export function hasErrors(errors: ComplimentErrors): boolean {
  return Boolean(errors.title || errors.text);
}

export function sortByNewest(compliments: ComplimentDto[]): ComplimentDto[] {
  return [...compliments].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
