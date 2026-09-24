import { describe, expect, it } from 'vitest';
import { mockPublicApi } from '../../test/publicApiMock';
import { ApiError } from './http';
import { publicApi } from './publicApi';
import type { SubscribeRequest } from './types';

const body: SubscribeRequest = {
  endpoint: 'https://push.example/1',
  keys: { p256dh: 'p256-key', auth: 'auth-key' },
  userAgent: 'UA',
  inviteCode: 'CODE-1',
};

describe('publicApi', () => {
  it('получает VAPID-ключ без заголовка Authorization', async () => {
    const calls = mockPublicApi();

    await expect(publicApi.getVapidPublicKey()).resolves.toBe('AQAB');
    expect(calls.vapid).toEqual([{ authorization: null }]);
  });

  it('подписывает без заголовка Authorization', async () => {
    const calls = mockPublicApi();

    await expect(publicApi.subscribe(body)).resolves.toEqual({
      id: 'subscription-1',
      message: 'Subscription created successfully',
    });
    expect(calls.subscribe).toEqual([{ body, authorization: null }]);
  });

  it('отписывает по endpoint без заголовка Authorization', async () => {
    const calls = mockPublicApi();

    await publicApi.unsubscribe('https://push.example/a b?x=1');

    expect(calls.unsubscribe).toEqual([{ endpoint: 'https://push.example/a b?x=1', authorization: null }]);
  });

  it('400 превращается в ApiError', async () => {
    mockPublicApi({ subscribeStatus: 400 });

    const promise = publicApi.subscribe(body);

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 400, traceId: 'trace-1' });
  });
});
