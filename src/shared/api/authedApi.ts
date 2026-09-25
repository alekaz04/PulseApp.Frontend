import { getUserManager } from '../../features/auth/userManager';
import { ApiError, request, type RequestOptions } from './http';
import type { ComplimentDto, ComplimentInput, ComplimentUpdate, MySubscriptionDto } from './types';

async function currentToken(): Promise<string | null> {
  const user = await getUserManager().getUser();
  return user && !user.expired ? user.access_token : null;
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Запрос с Bearer-токеном. На 401 — одно тихое обновление токена и повтор, затем вход заново.
 */
async function authedRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const send = (token: string | null) =>
    request<T>(path, {
      ...options,
      headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });

  try {
    return await send(await currentToken());
  } catch (error) {
    if (!isUnauthorized(error)) {
      throw error;
    }
  }

  const manager = getUserManager();
  let renewedToken: string | null = null;
  try {
    const user = await manager.signinSilent();
    renewedToken = user?.access_token ?? null;
  } catch {
    renewedToken = null;
  }

  if (renewedToken) {
    try {
      return await send(renewedToken);
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error;
      }
    }
  }

  await manager.signinRedirect({ state: { returnTo: window.location.pathname + window.location.search } });
  throw new ApiError(401, 'Требуется вход');
}

export const authedApi = {
  getCompliments(): Promise<ComplimentDto[]> {
    return authedRequest<ComplimentDto[]>('/api/compliment');
  },

  createCompliment(input: ComplimentInput): Promise<string> {
    return authedRequest<string>('/api/compliment', { method: 'POST', body: input });
  },

  createCompliments(inputs: ComplimentInput[]): Promise<string[]> {
    return authedRequest<string[]>('/api/compliment/batch', { method: 'POST', body: inputs });
  },

  updateCompliment(id: string, update: ComplimentUpdate): Promise<null> {
    return authedRequest<null>(`/api/compliment/${encodeURIComponent(id)}`, { method: 'PUT', body: update });
  },

  deleteCompliment(id: string): Promise<null> {
    return authedRequest<null>(`/api/compliment/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async createInviteCode(): Promise<string> {
    const code = await authedRequest<unknown>('/api/subscription/create', { method: 'POST' });
    if (typeof code !== 'string' || !code.trim()) {
      throw new ApiError(500, 'Сервер не вернул код приглашения');
    }
    return code.trim();
  },

  getMySubscriptions(): Promise<MySubscriptionDto[]> {
    return authedRequest<MySubscriptionDto[]>('/api/subscription');
  },

  sendCompliment(subscriptionId: string, complimentId: string): Promise<null> {
    const query = new URLSearchParams({ complimentId });
    return authedRequest<null>(`/api/subscription/push/to/${encodeURIComponent(subscriptionId)}?${query}`, {
      method: 'POST',
    });
  },
};
