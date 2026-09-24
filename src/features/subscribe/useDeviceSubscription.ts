import { useCallback, useEffect, useState } from 'react';
import { unsubscribeDevice } from '../../shared/push/pushSubscription';
import { findRegistration } from '../../shared/push/serviceWorker';

export type DeviceStatus = 'unknown' | 'none' | 'subscribed';

export type DeviceSubscriptionDeps = {
  findRegistration: () => Promise<ServiceWorkerRegistration | null>;
};

const defaultDeps: DeviceSubscriptionDeps = { findRegistration };

/**
 * Подписано ли это устройство. SW не регистрирует — только ищет существующий.
 */
export function useDeviceSubscription(deps: DeviceSubscriptionDeps = defaultDeps) {
  const [status, setStatus] = useState<DeviceStatus>('unknown');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const found = await deps.findRegistration();
        const subscription = found ? await found.pushManager.getSubscription() : null;
        if (cancelled) return;
        setRegistration(found);
        setStatus(subscription ? 'subscribed' : 'none');
      } catch {
        if (!cancelled) setStatus('none');
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [deps]);

  const unsubscribe = useCallback(async () => {
    if (!registration) {
      return;
    }
    try {
      const { backendOk } = await unsubscribeDevice(registration);
      setStatus('none');
      setNotice(
        backendOk
          ? 'Вы отписались от комплиментов.'
          : 'Уведомления на этом устройстве отключены, но сервер не подтвердил отписку.',
      );
    } catch {
      setNotice('Не удалось отписаться. Попробуйте ещё раз.');
    }
  }, [registration]);

  return { status, notice, unsubscribe };
}
