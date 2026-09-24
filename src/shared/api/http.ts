import { getApiBaseUrl } from '../../app/config';

/**
 * Ошибка запроса к API. status 0 — сбой сети.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly traceId: string | null;

  constructor(status: number, message: string, traceId: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.traceId = traceId;
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

type BackendErrorBody = {
  Message?: unknown;
  message?: unknown;
  TraceId?: unknown;
  traceId?: unknown;
};

function isJson(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').includes('application/json');
}

async function toApiError(response: Response): Promise<ApiError> {
  const text = await response.text().catch(() => '');
  if (text && isJson(response)) {
    try {
      // ErrorMiddleware бэкенда пишет { Message, TraceId }, остальной API — camelCase
      const body = JSON.parse(text) as BackendErrorBody;
      const message = body.Message ?? body.message;
      const traceId = body.TraceId ?? body.traceId;
      return new ApiError(
        response.status,
        typeof message === 'string' && message ? message : `HTTP ${response.status}`,
        typeof traceId === 'string' ? traceId : null,
      );
    } catch {
      // Заголовок JSON, а тело нет — вернём текст ниже
    }
  }
  return new ApiError(response.status, text || `HTTP ${response.status}`);
}

/**
 * Запрос к API. 204 и пустое тело → null, JSON разбирается, остальное возвращается строкой.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, 'Нет соединения с сервером');
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return null as T;
  }
  const text = await response.text();
  if (!text) {
    return null as T;
  }
  return (isJson(response) ? JSON.parse(text) : text) as T;
}

/**
 * Текст ошибки для пользователя и идентификатор запроса для поиска в логах.
 */
export function describeError(error: unknown): { message: string; traceId: string | null } {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return { message: 'Нет соединения с сервером', traceId: null };
    }
    if (error.status >= 500) {
      return { message: 'Ошибка сервера. Попробуйте позже', traceId: error.traceId };
    }
    return { message: error.message, traceId: error.traceId };
  }
  if (error instanceof Error && error.message) {
    return { message: error.message, traceId: null };
  }
  return { message: 'Неизвестная ошибка', traceId: null };
}
