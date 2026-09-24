import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensureRegistration, findRegistration } from './serviceWorker';

const registration = { scope: 'http://localhost:3000/' } as ServiceWorkerRegistration;

function stubServiceWorker() {
  const container = {
    register: vi.fn(async () => registration),
    ready: Promise.resolve(registration),
    getRegistration: vi.fn(async () => registration),
  };
  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
  return container;
}

afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).serviceWorker;
});

describe('serviceWorker', () => {
  it('ensureRegistration регистрирует /service-worker.js и ждёт активации', async () => {
    const container = stubServiceWorker();

    await expect(ensureRegistration()).resolves.toBe(registration);
    expect(container.register).toHaveBeenCalledWith('/service-worker.js', { scope: '/' });
  });

  it('findRegistration не регистрирует новый SW', async () => {
    const container = stubServiceWorker();

    await expect(findRegistration()).resolves.toBe(registration);
    expect(container.register).not.toHaveBeenCalled();
  });

  it('findRegistration без поддержки SW возвращает null', async () => {
    await expect(findRegistration()).resolves.toBeNull();
  });
});
