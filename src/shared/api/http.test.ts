import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, describeError, request } from './http';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Ожидалась ошибка');
}

describe('request', () => {
  it('ходит на origin + путь методом GET с Accept: application/json', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await request('/api/vapid');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://localhost:3000/api/vapid');
    expect(init?.method).toBe('GET');
    expect(init?.headers).toMatchObject({ Accept: 'application/json' });
  });

  it('отправляет тело как JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: '1' }));

    await request('/api/compliment', { method: 'POST', body: { title: 'T', text: 'X' } });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(init?.body).toBe('{"title":"T","text":"X"}');
  });

  it('разбирает JSON-ответ', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ publicKey: 'AQAB' }));
    await expect(request('/api/vapid')).resolves.toEqual({ publicKey: 'AQAB' });
  });

  it('204 возвращает null', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(request('/api/compliment/1', { method: 'DELETE' })).resolves.toBeNull();
  });

  it('text/plain возвращает строку', async () => {
    fetchMock.mockResolvedValueOnce(textResponse('3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b'));
    await expect(request('/api/subscription/create', { method: 'POST' })).resolves.toBe(
      '3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b',
    );
  });

  it('JSON-строка возвращает строку', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse('3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b'));
    await expect(request('/api/subscription/create', { method: 'POST' })).resolves.toBe(
      '3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b',
    );
  });

  it('разбирает ошибку бэкенда { Message, TraceId }', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ Message: 'Code is already used', TraceId: 'abc123' }, 400));

    const error = await catchError(request('/api/subscribe', { method: 'POST', body: {} }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: 'Code is already used', traceId: 'abc123' });
  });

  it('понимает ошибку в camelCase { message, traceId }', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Bad', traceId: 't-2' }, 400));
    await expect(catchError(request('/api/x'))).resolves.toMatchObject({ status: 400, message: 'Bad', traceId: 't-2' });
  });

  it('текстовая ошибка — текст в message', async () => {
    fetchMock.mockResolvedValueOnce(textResponse('Unauthorized', 401));
    await expect(catchError(request('/api/x'))).resolves.toMatchObject({ status: 401, message: 'Unauthorized', traceId: null });
  });

  it('пустая ошибка — «HTTP <статус>»', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 502 }));
    await expect(catchError(request('/api/x'))).resolves.toMatchObject({ status: 502, message: 'HTTP 502' });
  });

  it('сбой сети — ApiError со статусом 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(catchError(request('/api/x'))).resolves.toMatchObject({
      status: 0,
      message: 'Нет соединения с сервером',
    });
  });
});

describe('describeError', () => {
  it('сбой сети', () => {
    expect(describeError(new ApiError(0, 'x'))).toEqual({ message: 'Нет соединения с сервером', traceId: null });
  });

  it('ошибка сервера — общий текст и traceId', () => {
    expect(describeError(new ApiError(500, 'Internal Server Error', 't-1'))).toEqual({
      message: 'Ошибка сервера. Попробуйте позже',
      traceId: 't-1',
    });
  });

  it('4xx — сообщение бэкенда', () => {
    expect(describeError(new ApiError(400, 'Слишком длинный текст', 't-2'))).toEqual({
      message: 'Слишком длинный текст',
      traceId: 't-2',
    });
  });

  it('обычная ошибка — её текст', () => {
    expect(describeError(new Error('Что-то сломалось'))).toEqual({ message: 'Что-то сломалось', traceId: null });
  });

  it('неизвестное значение', () => {
    expect(describeError('oops')).toEqual({ message: 'Неизвестная ошибка', traceId: null });
  });
});
