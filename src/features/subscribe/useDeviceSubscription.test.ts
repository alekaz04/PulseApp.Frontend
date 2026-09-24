import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeRegistration, fakeSubscription } from '../../test/fakePush';
import { mockPublicApi } from '../../test/publicApiMock';
import { useDeviceSubscription, type DeviceSubscriptionDeps } from './useDeviceSubscription';

describe('useDeviceSubscription', () => {
  it('без регистрации SW — подписки нет', async () => {
    const deps: DeviceSubscriptionDeps = { findRegistration: async () => null };
    const { result } = renderHook(() => useDeviceSubscription(deps));

    await waitFor(() => expect(result.current.status).toBe('none'));
  });

  it('есть браузерная подписка — subscribed, отписка сообщает бэкенду', async () => {
    const calls = mockPublicApi();
    const { registration } = fakeRegistration({ current: fakeSubscription('https://push.example/1').subscription });
    const deps: DeviceSubscriptionDeps = { findRegistration: async () => registration };
    const { result } = renderHook(() => useDeviceSubscription(deps));
    await waitFor(() => expect(result.current.status).toBe('subscribed'));

    await act(() => result.current.unsubscribe());

    expect(result.current.status).toBe('none');
    expect(result.current.notice).toBe('Вы отписались от комплиментов.');
    expect(calls.unsubscribe).toEqual([{ endpoint: 'https://push.example/1', authorization: null }]);
  });

  it('сервер не подтвердил отписку — предупреждение', async () => {
    mockPublicApi({ unsubscribeStatus: 500 });
    const { registration } = fakeRegistration({ current: fakeSubscription().subscription });
    const deps: DeviceSubscriptionDeps = { findRegistration: async () => registration };
    const { result } = renderHook(() => useDeviceSubscription(deps));
    await waitFor(() => expect(result.current.status).toBe('subscribed'));

    await act(() => result.current.unsubscribe());

    expect(result.current.notice).toBe('Уведомления на этом устройстве отключены, но сервер не подтвердил отписку.');
  });
});
