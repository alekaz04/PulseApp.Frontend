import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../test/server';
import { authedApi } from './authedApi';
import { ApiError } from './http';

const manager = vi.hoisted(() => ({
  getUser: vi.fn(),
  signinSilent: vi.fn(),
  signinRedirect: vi.fn(),
}));

vi.mock('../../features/auth/userManager', () => ({ getUserManager: () => manager }));

function user(token: string) {
  return { access_token: token, expired: false };
}

beforeEach(() => {
  manager.getUser.mockReset().mockResolvedValue(user('token-1'));
  manager.signinSilent.mockReset();
  manager.signinRedirect.mockReset().mockResolvedValue(undefined);
});

describe('authedApi', () => {
  it('добавляет Bearer-токен', async () => {
    let authorization: string | null = null;
    server.use(
      http.get('*/api/compliment', ({ request }) => {
        authorization = request.headers.get('authorization');
        return HttpResponse.json([]);
      }),
    );

    await expect(authedApi.getCompliments()).resolves.toEqual([]);
    expect(authorization).toBe('Bearer token-1');
  });

  it('на 401 один раз обновляет токен и повторяет запрос', async () => {
    const seen: Array<string | null> = [];
    server.use(
      http.get('*/api/compliment', ({ request }) => {
        const header = request.headers.get('authorization');
        seen.push(header);
        return header === 'Bearer token-2' ? HttpResponse.json([]) : new HttpResponse(null, { status: 401 });
      }),
    );
    manager.signinSilent.mockResolvedValue(user('token-2'));

    await expect(authedApi.getCompliments()).resolves.toEqual([]);
    expect(seen).toEqual(['Bearer token-1', 'Bearer token-2']);
    expect(manager.signinRedirect).not.toHaveBeenCalled();
  });

  it('если и после обновления 401 — отправляет на вход', async () => {
    server.use(http.get('*/api/compliment', () => new HttpResponse(null, { status: 401 })));
    manager.signinSilent.mockResolvedValue(user('token-2'));

    await expect(authedApi.getCompliments()).rejects.toMatchObject({ status: 401, message: 'Требуется вход' });
    expect(manager.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/' } });
  });

  it('если тихое обновление не удалось — отправляет на вход', async () => {
    server.use(http.get('*/api/compliment', () => new HttpResponse(null, { status: 401 })));
    manager.signinSilent.mockRejectedValue(new Error('login_required'));

    await expect(authedApi.getCompliments()).rejects.toBeInstanceOf(ApiError);
    expect(manager.signinRedirect).toHaveBeenCalledOnce();
  });

  it('другие ошибки не трогают вход', async () => {
    server.use(
      http.get('*/api/compliment', () => HttpResponse.json({ Message: 'boom', TraceId: 't-1' }, { status: 500 })),
    );

    await expect(authedApi.getCompliments()).rejects.toMatchObject({ status: 500, traceId: 't-1' });
    expect(manager.signinSilent).not.toHaveBeenCalled();
  });

  it('просроченный токен не отправляется', async () => {
    manager.getUser.mockResolvedValue({ access_token: 'old', expired: true });
    let authorization: string | null = 'не вызвано';
    server.use(
      http.get('*/api/subscription', ({ request }) => {
        authorization = request.headers.get('authorization');
        return HttpResponse.json([]);
      }),
    );

    await authedApi.getMySubscriptions();

    expect(authorization).toBeNull();
  });

  it('createInviteCode понимает JSON-строку', async () => {
    server.use(http.post('*/api/subscription/create', () => HttpResponse.json('3f2b-code')));
    await expect(authedApi.createInviteCode()).resolves.toBe('3f2b-code');
  });

  it('createInviteCode понимает text/plain', async () => {
    server.use(http.post('*/api/subscription/create', () => HttpResponse.text(' 3f2b-code\n')));
    await expect(authedApi.createInviteCode()).resolves.toBe('3f2b-code');
  });

  it('createInviteCode без кода — ошибка', async () => {
    server.use(http.post('*/api/subscription/create', () => HttpResponse.text('')));
    await expect(authedApi.createInviteCode()).rejects.toMatchObject({
      message: 'Сервер не вернул код приглашения',
    });
  });

  it('updateCompliment шлёт PUT с полным телом, deleteCompliment — DELETE', async () => {
    const requests: Array<{ method: string; path: string; body: unknown }> = [];
    server.use(
      http.put('*/api/compliment/:id', async ({ request }) => {
        requests.push({ method: 'PUT', path: new URL(request.url).pathname, body: await request.json() });
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('*/api/compliment/:id', ({ request }) => {
        requests.push({ method: 'DELETE', path: new URL(request.url).pathname, body: null });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await authedApi.updateCompliment('id-1', { title: 'T', text: 'X', isBeenPushed: false });
    await authedApi.deleteCompliment('id-1');

    expect(requests).toEqual([
      { method: 'PUT', path: '/api/compliment/id-1', body: { title: 'T', text: 'X', isBeenPushed: false } },
      { method: 'DELETE', path: '/api/compliment/id-1', body: null },
    ]);
  });

  it('sendCompliment шлёт POST на push/to/{id} с complimentId в query', async () => {
    let seen: { method: string; path: string; complimentId: string | null } | null = null;
    server.use(
      http.post('*/api/subscription/push/to/:id', ({ request }) => {
        const url = new URL(request.url);
        seen = { method: request.method, path: url.pathname, complimentId: url.searchParams.get('complimentId') };
        return new HttpResponse(null, { status: 200 });
      }),
    );

    await expect(authedApi.sendCompliment('sub-1', 'comp-1')).resolves.toBeNull();
    expect(seen).toEqual({ method: 'POST', path: '/api/subscription/push/to/sub-1', complimentId: 'comp-1' });
  });

  it('createCompliments шлёт массив в batch', async () => {
    let body: unknown = null;
    server.use(
      http.post('*/api/compliment/batch', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(['a', 'b']);
      }),
    );

    await expect(
      authedApi.createCompliments([
        { title: 'T', text: '1' },
        { title: 'T', text: '2' },
      ]),
    ).resolves.toEqual(['a', 'b']);
    expect(body).toEqual([
      { title: 'T', text: '1' },
      { title: 'T', text: '2' },
    ]);
  });
});
