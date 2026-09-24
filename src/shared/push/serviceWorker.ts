const SERVICE_WORKER_URL = '/service-worker.js';

/**
 * Регистрирует service worker и ждёт, пока он станет активным.
 */
export async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
  return navigator.serviceWorker.ready;
}

/**
 * Уже существующая регистрация. Новую не создаёт: лендингу SW нужен, только если подписка есть.
 */
export async function findRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  return (await navigator.serviceWorker.getRegistration('/')) ?? null;
}
