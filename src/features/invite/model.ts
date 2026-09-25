import { charCount } from '../compliments/model';

export const NAME_MAX = 100;

/**
 * Ошибка для имени получателя или undefined, если имя подходит. Пробелы по краям не учитываются.
 */
export function validateName(name: string): string | undefined {
  const value = name.trim();
  if (!value) {
    return 'Введите имя';
  }
  if (charCount(value) > NAME_MAX) {
    return `Не больше ${NAME_MAX} символов`;
  }
  return undefined;
}
