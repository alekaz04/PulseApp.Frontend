import { describe, expect, it } from 'vitest';
import type { MySubscriptionDto } from '../../shared/api/types';
import { parseUserAgent, sortSubscriptions } from './model';

describe('parseUserAgent', () => {
  it.each([
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      'iPhone · Safari',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'iPhone · веб-приложение',
    ],
    [
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      'Android · Chrome',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Windows · Chrome',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
      'Windows · Edge',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.6.0.0 Safari/537.36',
      'Windows · Яндекс Браузер',
    ],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0', 'Windows · Firefox'],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      'Mac · Safari',
    ],
    ['curl/8.0', 'Неизвестное устройство'],
    [null, 'Неизвестное устройство'],
  ])('%s → %s', (userAgent, expected) => {
    expect(parseUserAgent(userAgent)).toBe(expected);
  });
});

describe('sortSubscriptions', () => {
  it('активные сверху, внутри — новые сверху', () => {
    const items = [
      { id: 'inactive-new', isActive: false, createdAt: '2026-09-20T10:00:00+00:00' },
      { id: 'active-old', isActive: true, createdAt: '2026-09-01T10:00:00+00:00' },
      { id: 'active-new', isActive: true, createdAt: '2026-09-10T10:00:00+00:00' },
    ] as MySubscriptionDto[];

    expect(sortSubscriptions(items).map((item) => item.id)).toEqual(['active-new', 'active-old', 'inactive-new']);
  });
});
