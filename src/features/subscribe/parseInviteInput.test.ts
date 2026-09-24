import { describe, expect, it } from 'vitest';
import { parseInviteInput } from './parseInviteInput';

const CODE = '3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b';

describe('parseInviteInput', () => {
  it.each([
    [CODE, CODE],
    [`  ${CODE}  `, CODE],
    [`https://pulse.lvakarin.ru/s/${CODE}`, CODE],
    [`https://pulse.lvakarin.ru/s/${CODE}/`, CODE],
    [`https://pulse.lvakarin.ru/s/${CODE}?utm=tg#top`, CODE],
    [`Подпишись на мои комплименты: https://pulse.lvakarin.ru/s/${CODE}`, CODE],
  ])('%s → код', (input, expected) => {
    expect(parseInviteInput(input)).toBe(expected);
  });

  it.each(['', '   ', 'abc', 'hello world', 'https://example.com/other', '/s/%E0%A4%A'])('%s → null', (input) => {
    expect(parseInviteInput(input)).toBeNull();
  });
});
