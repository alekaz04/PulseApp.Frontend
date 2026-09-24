import { describe, expect, it } from 'vitest';
import { buildInviteUrl } from './buildInviteUrl';

describe('buildInviteUrl', () => {
  it('origin + /s/ + код', () => {
    expect(buildInviteUrl('https://pulse.lvakarin.ru', 'abc-123')).toBe('https://pulse.lvakarin.ru/s/abc-123');
  });

  it('убирает слэш в конце origin и кодирует код', () => {
    expect(buildInviteUrl('https://pulse.lvakarin.ru/', 'a b')).toBe('https://pulse.lvakarin.ru/s/a%20b');
  });
});
