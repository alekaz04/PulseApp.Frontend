import { request } from './http';
import type { SubscribeRequest, SubscribeResponse, UnsubscribeResponse, VapidResponse } from './types';

/**
 * Анонимные запросы получателя. Заголовок Authorization здесь не передаётся никогда:
 * подписка работает только по коду приглашения.
 */
export const publicApi = {
  async getVapidPublicKey(): Promise<string> {
    const { publicKey } = await request<VapidResponse>('/api/vapid');
    return publicKey;
  },

  subscribe(body: SubscribeRequest): Promise<SubscribeResponse> {
    return request<SubscribeResponse>('/api/subscribe', { method: 'POST', body });
  },

  unsubscribe(endpoint: string): Promise<UnsubscribeResponse> {
    return request<UnsubscribeResponse>(`/api/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
    });
  },
};
