import type { ComplimentInput } from '../../shared/api/types';
import { charCount, TEXT_MAX, TITLE_MAX } from './model';

export const DEFAULT_BULK_TITLE = 'Комплимент для тебя 💌';

export type BulkParseResult = { ok: true; items: ComplimentInput[] } | { ok: false; error: string };

/**
 * Каждая непустая строка — отдельный комплимент с общим заголовком.
 * Номер строки в ошибке — по исходному тексту, с учётом пустых строк.
 */
export function parseBulk(title: string, text: string): BulkParseResult {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return { ok: false, error: 'Введите заголовок' };
  }
  if (charCount(cleanTitle) > TITLE_MAX) {
    return { ok: false, error: `Заголовок длиннее ${TITLE_MAX} символов` };
  }

  const items: ComplimentInput[] = [];
  const rows = text.split(/\r\n|\r|\n/);
  for (let index = 0; index < rows.length; index += 1) {
    const line = (rows[index] ?? '').trim();
    if (!line) {
      continue;
    }
    if (charCount(line) > TEXT_MAX) {
      return { ok: false, error: `Строка ${index + 1} длиннее ${TEXT_MAX} символов` };
    }
    items.push({ title: cleanTitle, text: line });
  }

  if (items.length === 0) {
    return { ok: false, error: 'Добавьте хотя бы одну строку' };
  }
  return { ok: true, items };
}
