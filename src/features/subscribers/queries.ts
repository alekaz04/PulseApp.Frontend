import { useQuery } from '@tanstack/react-query';
import { authedApi } from '../../shared/api/authedApi';

export const subscriptionsKey = ['subscriptions'] as const;

export function useSubscriptions() {
  return useQuery({ queryKey: subscriptionsKey, queryFn: () => authedApi.getMySubscriptions() });
}
