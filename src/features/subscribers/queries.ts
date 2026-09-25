import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '../../shared/api/authedApi';
import { describeError } from '../../shared/api/http';
import { useToast } from '../../shared/ui/toastContext';

export const subscriptionsKey = ['subscriptions'] as const;

export function useSubscriptions() {
  return useQuery({ queryKey: subscriptionsKey, queryFn: () => authedApi.getMySubscriptions() });
}

export type SendComplimentVariables = {
  subscriptionId: string;
  complimentId: string;
};

/**
 * Отправка комплимента одному подписчику: тост и обновление списка подписок.
 */
export function useSendCompliment() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ subscriptionId, complimentId }: SendComplimentVariables) =>
      authedApi.sendCompliment(subscriptionId, complimentId),
    onSuccess: () => {
      toast.show('Комплимент отправлен', { type: 'success' });
    },
    onError: (error) => {
      const { message, traceId } = describeError(error);
      toast.show(message, { type: 'error', traceId });
    },
    onSettled: () => {
      // Если push-сервис ответил 404/410, бэкенд отключает подписку — статус в таблице надо обновить
      void queryClient.invalidateQueries({ queryKey: subscriptionsKey });
    },
  });
}
