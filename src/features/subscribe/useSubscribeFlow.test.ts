import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { readRecord, writeRecord } from '../../shared/push/localRecord';
import type { PlatformInfo } from '../../shared/push/support';
import { fakeRegistration, fakeSubscription } from '../../test/fakePush';
import { mockPublicApi } from '../../test/publicApiMock';
import { server } from '../../test/server';
import { SUBSCRIBE_MESSAGES, type SubscribeDeps } from './subscribeFlow';
import { useSubscribeFlow } from './useSubscribeFlow';

const desktopChrome: PlatformInfo = { isIos: false, iosVersion: null, isStandalone: false, pushSupported: true };

function makeDeps(
  options: {
    current?: PushSubscription | null;
    platform?: PlatformInfo;
    permission?: NotificationPermission;
  } = {},
) {
  const { registration, pushManager } = fakeRegistration({ current: options.current ?? null });
  const requestPermission = vi.fn(async () => options.permission ?? ('granted' as NotificationPermission));
  const deps: SubscribeDeps = {
    platform: () => options.platform ?? desktopChrome,
    getRegistration: async () => registration,
    requestPermission,
  };
  return { deps, pushManager, requestPermission };
}

async function renderFlow(code: string, deps: SubscribeDeps) {
  const hook = renderHook(() => useSubscribeFlow(code, deps));
  await waitFor(() => expect(hook.result.current.state.kind).not.toBe('checking'));
  return hook;
}

describe('useSubscribeFlow: начальное состояние', () => {
  it('iOS во вкладке Safari — ios-install, SW не регистрируется', async () => {
    const getRegistration = vi.fn();
    const deps: SubscribeDeps = {
      platform: () => ({ isIos: true, iosVersion: { major: 17, minor: 5 }, isStandalone: false, pushSupported: false }),
      getRegistration,
      requestPermission: vi.fn(),
    };

    const { result } = await renderFlow('CODE-1', deps);

    expect(result.current.state).toEqual({ kind: 'ios-install' });
    expect(getRegistration).not.toHaveBeenCalled();
  });

  it('нет подписки — ready', async () => {
    const { deps } = makeDeps();
    const { result } = await renderFlow('CODE-1', deps);
    expect(result.current.state).toEqual({ kind: 'ready' });
  });

  it('это устройство уже подписано этим кодом — subscribed', async () => {
    writeRecord('CODE-1', 'https://push.example/old');
    const { deps } = makeDeps({ current: fakeSubscription('https://push.example/old').subscription });

    const { result } = await renderFlow('CODE-1', deps);

    expect(result.current.state).toEqual({ kind: 'subscribed' });
  });

  it('устройство подписано по другой ссылке — other-author', async () => {
    writeRecord('OLD-CODE', 'https://push.example/old');
    const { deps } = makeDeps({ current: fakeSubscription('https://push.example/old').subscription });

    const { result } = await renderFlow('NEW-CODE', deps);

    expect(result.current.state).toEqual({ kind: 'other-author' });
  });

  it('устаревшая запись без браузерной подписки удаляется', async () => {
    writeRecord('CODE-1', 'https://push.example/old');
    const { deps } = makeDeps();

    const { result } = await renderFlow('CODE-1', deps);

    expect(result.current.state).toEqual({ kind: 'ready' });
    expect(readRecord()).toBeNull();
  });
});

describe('useSubscribeFlow: подписка', () => {
  it('успех: POST с кодом без Authorization, запись сохраняется', async () => {
    const calls = mockPublicApi();
    const { deps } = makeDeps();
    const { result } = await renderFlow('CODE-1', deps);

    act(() => result.current.subscribe());

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'success' }));
    expect(calls.subscribe).toEqual([
      {
        body: {
          endpoint: 'https://push.example/new',
          keys: { p256dh: 'p256-key', auth: 'auth-key' },
          userAgent: expect.any(String),
          inviteCode: 'CODE-1',
        },
        authorization: null,
      },
    ]);
    expect(readRecord()).toMatchObject({ code: 'CODE-1', endpoint: 'https://push.example/new' });
  });

  it('разрешение не выдано — denied, на сервер ничего не уходит', async () => {
    const calls = mockPublicApi();
    const { deps } = makeDeps({ permission: 'denied' });
    const { result } = await renderFlow('CODE-1', deps);

    act(() => result.current.subscribe());

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'denied' }));
    expect(calls.subscribe).toEqual([]);
  });

  it('400 от сервера — invalid-link', async () => {
    mockPublicApi({ subscribeStatus: 400 });
    const { deps } = makeDeps();
    const { result } = await renderFlow('CODE-1', deps);

    act(() => result.current.subscribe());

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'invalid-link' }));
    expect(readRecord()).toBeNull();
  });

  it('500 — ошибка с повтором; повтор успешен', async () => {
    mockPublicApi();
    server.use(
      http.post('*/api/subscribe', () => HttpResponse.json({ Message: 'boom' }, { status: 500 }), { once: true }),
    );
    const { deps } = makeDeps();
    const { result } = await renderFlow('CODE-1', deps);

    act(() => result.current.subscribe());
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'error', message: SUBSCRIBE_MESSAGES.server }));

    act(() => result.current.subscribe());
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'success' }));
  });

  it('нет сети — понятный текст', async () => {
    mockPublicApi();
    server.use(http.post('*/api/subscribe', () => HttpResponse.error()));
    const { deps } = makeDeps();
    const { result } = await renderFlow('CODE-1', deps);

    act(() => result.current.subscribe());

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'error', message: SUBSCRIBE_MESSAGES.offline }));
  });

  // Review Focus 2
  it('pushManager.subscribe бросает исключение — понятный текст, а не текст исключения', async () => {
    const calls = mockPublicApi();
    const { deps, pushManager } = makeDeps();
    pushManager.subscribe.mockRejectedValueOnce(new DOMException('Registration failed - push service error', 'AbortError'));
    const { result } = await renderFlow('CODE-1', deps);

    act(() => result.current.subscribe());

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'error', message: SUBSCRIBE_MESSAGES.browser }));
    expect(calls.subscribe).toEqual([]);
  });

  // Review Focus 1
  it('двойное нажатие отправляет ровно один POST', async () => {
    const calls = mockPublicApi();
    const { deps, requestPermission } = makeDeps();
    const { result } = await renderFlow('CODE-1', deps);

    act(() => {
      result.current.subscribe();
      result.current.subscribe();
    });

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'success' }));
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(calls.subscribe).toHaveLength(1);
  });

  it('переключение на другого автора: старый endpoint отписывается, новый подписывается', async () => {
    const calls = mockPublicApi();
    writeRecord('OLD-CODE', 'https://push.example/old');
    const old = fakeSubscription('https://push.example/old');
    const { deps } = makeDeps({ current: old.subscription });
    const { result } = await renderFlow('NEW-CODE', deps);

    act(() => result.current.subscribe());

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'success' }));
    expect(calls.unsubscribe).toEqual([{ endpoint: 'https://push.example/old', authorization: null }]);
    expect(old.unsubscribe).toHaveBeenCalledOnce();
    expect(calls.subscribe[0]?.body).toMatchObject({ endpoint: 'https://push.example/new', inviteCode: 'NEW-CODE' });
    expect(readRecord()).toMatchObject({ code: 'NEW-CODE', endpoint: 'https://push.example/new' });
  });
});

describe('useSubscribeFlow: отписка', () => {
  it('отписывает устройство и возвращается в ready', async () => {
    const calls = mockPublicApi();
    writeRecord('CODE-1', 'https://push.example/old');
    const { deps } = makeDeps({ current: fakeSubscription('https://push.example/old').subscription });
    const { result } = await renderFlow('CODE-1', deps);

    act(() => result.current.unsubscribe());

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'ready' }));
    expect(calls.unsubscribe).toHaveLength(1);
    expect(result.current.notice).toBeNull();
    expect(readRecord()).toBeNull();
  });

  it('сервер не подтвердил отписку — предупреждение', async () => {
    mockPublicApi({ unsubscribeStatus: 500 });
    writeRecord('CODE-1', 'https://push.example/old');
    const { deps } = makeDeps({ current: fakeSubscription('https://push.example/old').subscription });
    const { result } = await renderFlow('CODE-1', deps);

    act(() => result.current.unsubscribe());

    await waitFor(() => expect(result.current.state).toEqual({ kind: 'ready' }));
    expect(result.current.notice).toBe(SUBSCRIBE_MESSAGES.unsubscribeNotConfirmed);
  });
});
