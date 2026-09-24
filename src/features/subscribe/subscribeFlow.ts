import { ApiError } from '../../shared/api/http';
import { publicApi } from '../../shared/api/publicApi';
import { clearRecord, readRecord, writeRecord, type SubscriptionRecord } from '../../shared/push/localRecord';
import { createFreshSubscription, type PushKeys } from '../../shared/push/pushSubscription';
import { ensureRegistration } from '../../shared/push/serviceWorker';
import { detectPlatform, isIosPushCapable, type PlatformInfo } from '../../shared/push/support';

export type SubscribeState =
  | { kind: 'checking' }
  | { kind: 'unsupported'; oldIos: boolean }
  | { kind: 'ios-install' }
  | { kind: 'ready' }
  | { kind: 'other-author' }
  | { kind: 'working' }
  | { kind: 'denied' }
  | { kind: 'success' }
  | { kind: 'subscribed' }
  | { kind: 'invalid-link' }
  | { kind: 'error'; message: string };

export type SubscribeDeps = {
  platform: () => PlatformInfo;
  getRegistration: () => Promise<ServiceWorkerRegistration>;
  requestPermission: () => Promise<NotificationPermission>;
};

export const defaultSubscribeDeps: SubscribeDeps = {
  platform: () => detectPlatform(),
  getRegistration: ensureRegistration,
  requestPermission: () => Notification.requestPermission(),
};

export const SUBSCRIBE_MESSAGES = {
  browser: 'Браузер не смог оформить подписку. Попробуйте ещё раз.',
  offline: 'Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз.',
  server: 'Сервер временно недоступен. Попробуйте ещё раз.',
  prepare: 'Не удалось подготовить подписку. Обновите страницу.',
  unsubscribeFailed: 'Не удалось отписаться. Попробуйте ещё раз.',
  unsubscribeNotConfirmed: 'Уведомления на этом устройстве отключены, но сервер не подтвердил отписку.',
} as const;

/**
 * Состояние, которое определяется только платформой. null — платформа подходит, дальше смотрим подписку.
 */
export function resolvePlatformState(platform: PlatformInfo): SubscribeState | null {
  if (platform.isIos && !isIosPushCapable(platform)) {
    return { kind: 'unsupported', oldIos: true };
  }
  if (platform.isIos && !platform.isStandalone) {
    return { kind: 'ios-install' };
  }
  if (!platform.pushSupported) {
    return { kind: 'unsupported', oldIos: false };
  }
  return null;
}

/**
 * Состояние по браузерной подписке и локальной записи о ней.
 */
export function resolveSubscriptionState(
  code: string,
  browserEndpoint: string | null,
  record: SubscriptionRecord | null,
): { state: SubscribeState; clearRecord: boolean } {
  if (record && browserEndpoint === null) {
    return { state: { kind: 'ready' }, clearRecord: true };
  }
  if (record && record.code === code && record.endpoint === browserEndpoint) {
    return { state: { kind: 'subscribed' }, clearRecord: false };
  }
  if (record && record.code !== code) {
    return { state: { kind: 'other-author' }, clearRecord: false };
  }
  return { state: { kind: 'ready' }, clearRecord: false };
}

function serverMessage(error: unknown): string {
  return error instanceof ApiError && error.status === 0 ? SUBSCRIBE_MESSAGES.offline : SUBSCRIBE_MESSAGES.server;
}

/**
 * Подписка по коду. Первым действием запрашивает разрешение — вызывать прямо из обработчика нажатия,
 * иначе iOS не покажет запрос.
 */
export async function performSubscribe(code: string, deps: SubscribeDeps): Promise<SubscribeState> {
  const permission = await deps.requestPermission();
  if (permission !== 'granted') {
    return { kind: 'denied' };
  }

  let keys: PushKeys;
  try {
    const registration = await deps.getRegistration();
    const record = readRecord();
    if (record && record.code !== code) {
      // Одно устройство — один автор: старую подписку снимаем на сервере явно
      await publicApi.unsubscribe(record.endpoint).catch(() => undefined);
      clearRecord();
    }
    keys = await createFreshSubscription(registration);
  } catch (error) {
    return { kind: 'error', message: error instanceof ApiError ? serverMessage(error) : SUBSCRIBE_MESSAGES.browser };
  }

  try {
    await publicApi.subscribe({
      endpoint: keys.endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      userAgent: navigator.userAgent,
      inviteCode: code,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return { kind: 'invalid-link' };
    }
    return { kind: 'error', message: serverMessage(error) };
  }

  writeRecord(code, keys.endpoint);
  return { kind: 'success' };
}
