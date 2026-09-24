import { vi } from 'vitest';

export function fakeSubscription(endpoint = 'https://push.example/old') {
  const unsubscribe = vi.fn(async () => true);
  const subscription = {
    endpoint,
    unsubscribe,
    toJSON: () => ({ endpoint, keys: { p256dh: 'p256-key', auth: 'auth-key' } }),
  } as unknown as PushSubscription;
  return { subscription, unsubscribe };
}

export function fakeRegistration(options: { current?: PushSubscription | null; next?: PushSubscription } = {}) {
  const pushManager = {
    getSubscription: vi.fn(async (): Promise<PushSubscription | null> => options.current ?? null),
    subscribe: vi.fn(
      async (): Promise<PushSubscription> =>
        options.next ?? fakeSubscription('https://push.example/new').subscription,
    ),
  };
  const registration = { pushManager } as unknown as ServiceWorkerRegistration;
  return { registration, pushManager };
}
