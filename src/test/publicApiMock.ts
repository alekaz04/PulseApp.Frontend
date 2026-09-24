import { http, HttpResponse } from 'msw';
import { server } from './server';

type Options = {
  subscribeStatus?: number;
  unsubscribeStatus?: number;
  vapidKey?: string;
};

export type PublicApiCalls = {
  vapid: Array<{ authorization: string | null }>;
  subscribe: Array<{ body: unknown; authorization: string | null }>;
  unsubscribe: Array<{ endpoint: string | null; authorization: string | null }>;
};

/**
 * Моки анонимного API получателя. Возвращает журнал вызовов.
 */
export function mockPublicApi(options: Options = {}): PublicApiCalls {
  const calls: PublicApiCalls = { vapid: [], subscribe: [], unsubscribe: [] };

  server.use(
    http.get('*/api/vapid', ({ request }) => {
      calls.vapid.push({ authorization: request.headers.get('authorization') });
      return HttpResponse.json({ publicKey: options.vapidKey ?? 'AQAB' });
    }),
    http.post('*/api/subscribe', async ({ request }) => {
      calls.subscribe.push({ body: await request.json(), authorization: request.headers.get('authorization') });
      const status = options.subscribeStatus ?? 200;
      return status === 200
        ? HttpResponse.json({ id: 'subscription-1', message: 'Subscription created successfully' })
        : HttpResponse.json({ Message: 'Code is already used', TraceId: 'trace-1' }, { status });
    }),
    http.delete('*/api/subscribe', ({ request }) => {
      calls.unsubscribe.push({
        endpoint: new URL(request.url).searchParams.get('endpoint'),
        authorization: request.headers.get('authorization'),
      });
      const status = options.unsubscribeStatus ?? 200;
      return status === 200
        ? HttpResponse.json({ success: true, message: 'Successfully unsubscribed' })
        : HttpResponse.json({ Message: 'Internal Server Error', TraceId: 'trace-2' }, { status });
    }),
  );

  return calls;
}
