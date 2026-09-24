import { publicApi } from '../api/publicApi';
import { clearRecord } from './localRecord';

export type PushKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function toPushKeys(subscription: PushSubscription): PushKeys {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('Браузер вернул неполную push-подписку');
  }
  return { endpoint: json.endpoint, p256dh, auth };
}

/**
 * Создаёт браузерную подписку с нуля. Существующая удаляется, чтобы endpoint был новым:
 * бэкенд не принимает уже известный endpoint повторно.
 */
export async function createFreshSubscription(registration: ServiceWorkerRegistration): Promise<PushKeys> {
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }
  const publicKey = await publicApi.getVapidPublicKey();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  return toPushKeys(subscription);
}

/**
 * Отписывает устройство: сообщает бэкенду, удаляет браузерную подписку и локальную запись.
 * Ошибка бэкенда не мешает отписке в браузере.
 */
export async function unsubscribeDevice(registration: ServiceWorkerRegistration): Promise<{ backendOk: boolean }> {
  const subscription = await registration.pushManager.getSubscription();
  let backendOk = true;
  if (subscription) {
    try {
      await publicApi.unsubscribe(subscription.endpoint);
    } catch {
      backendOk = false;
    }
    await subscription.unsubscribe();
  }
  clearRecord();
  return { backendOk };
}
