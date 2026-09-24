import { useCallback, useEffect, useRef, useState } from 'react';
import { clearRecord, readRecord } from '../../shared/push/localRecord';
import { unsubscribeDevice } from '../../shared/push/pushSubscription';
import {
  defaultSubscribeDeps,
  performSubscribe,
  resolvePlatformState,
  resolveSubscriptionState,
  SUBSCRIBE_MESSAGES,
  type SubscribeDeps,
  type SubscribeState,
} from './subscribeFlow';

export function useSubscribeFlow(code: string, deps: SubscribeDeps = defaultSubscribeDeps) {
  const [state, setState] = useState<SubscribeState>({ kind: 'checking' });
  const [notice, setNotice] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const platformState = resolvePlatformState(deps.platform());
      if (platformState) {
        if (!cancelled) setState(platformState);
        return;
      }
      try {
        const registration = await deps.getRegistration();
        const subscription = await registration.pushManager.getSubscription();
        const resolved = resolveSubscriptionState(code, subscription?.endpoint ?? null, readRecord());
        if (resolved.clearRecord) {
          clearRecord();
        }
        if (!cancelled) setState(resolved.state);
      } catch {
        if (!cancelled) setState({ kind: 'error', message: SUBSCRIBE_MESSAGES.prepare });
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [code, deps]);

  const subscribe = useCallback(() => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setNotice(null);
    setState({ kind: 'working' });
    // performSubscribe синхронно вызывает requestPermission — жест пользователя сохраняется
    void performSubscribe(code, deps)
      .then(setState)
      .finally(() => {
        busy.current = false;
      });
  }, [code, deps]);

  const unsubscribe = useCallback(() => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setNotice(null);
    setState({ kind: 'working' });

    async function run() {
      try {
        const registration = await deps.getRegistration();
        const { backendOk } = await unsubscribeDevice(registration);
        if (!backendOk) {
          setNotice(SUBSCRIBE_MESSAGES.unsubscribeNotConfirmed);
        }
        setState({ kind: 'ready' });
      } catch {
        setState({ kind: 'error', message: SUBSCRIBE_MESSAGES.unsubscribeFailed });
      } finally {
        busy.current = false;
      }
    }

    void run();
  }, [deps]);

  return { state, notice, subscribe, unsubscribe };
}
