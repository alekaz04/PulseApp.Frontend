import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '../../shared/api/authedApi';
import { describeError } from '../../shared/api/http';
import type { ComplimentInput, ComplimentUpdate } from '../../shared/api/types';
import { useToast } from '../../shared/ui/toastContext';

export const complimentsKey = ['compliments'] as const;

export function useCompliments() {
  return useQuery({ queryKey: complimentsKey, queryFn: () => authedApi.getCompliments() });
}

/**
 * Мутация комплиментов: тост об успехе или ошибке и обновление списка.
 */
export function useComplimentMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: (variables: TVariables) => string,
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      toast.show(successMessage(variables), { type: 'success' });
      return queryClient.invalidateQueries({ queryKey: complimentsKey });
    },
    onError: (error) => {
      const { message, traceId } = describeError(error);
      toast.show(message, { type: 'error', traceId });
    },
  });
}

export function useCreateCompliment() {
  return useComplimentMutation(
    (input: ComplimentInput) => authedApi.createCompliment(input),
    () => 'Комплимент добавлен',
  );
}

export type UpdateVariables = {
  id: string;
  update: ComplimentUpdate;
  successMessage: string;
};

export function useUpdateCompliment() {
  return useComplimentMutation(
    (variables: UpdateVariables) => authedApi.updateCompliment(variables.id, variables.update),
    (variables) => variables.successMessage,
  );
}

export function useDeleteCompliment() {
  return useComplimentMutation(
    (id: string) => authedApi.deleteCompliment(id),
    () => 'Комплимент удалён',
  );
}

export function useCreateCompliments() {
  return useComplimentMutation(
    (items: ComplimentInput[]) => authedApi.createCompliments(items),
    (items) => `Добавлено: ${items.length}`,
  );
}
