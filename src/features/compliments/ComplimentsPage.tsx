import { useMemo, useState } from 'react';
import { describeError } from '../../shared/api/http';
import type { ComplimentDto, ComplimentInput } from '../../shared/api/types';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { Modal } from '../../shared/ui/Modal';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Spinner } from '../../shared/ui/Spinner';
import { BulkImport } from './BulkImport';
import { ComplimentForm } from './ComplimentForm';
import { ComplimentsTable } from './ComplimentsTable';
import { sortByNewest } from './model';
import {
  useCompliments,
  useCreateCompliment,
  useCreateCompliments,
  useDeleteCompliment,
  useUpdateCompliment,
} from './queries';

type Dialog =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'bulk' }
  | { kind: 'edit'; compliment: ComplimentDto }
  | { kind: 'delete'; compliment: ComplimentDto };

export default function ComplimentsPage() {
  const query = useCompliments();
  const createMutation = useCreateCompliment();
  const createManyMutation = useCreateCompliments();
  const updateMutation = useUpdateCompliment();
  const deleteMutation = useDeleteCompliment();
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });

  const compliments = useMemo(() => sortByNewest(query.data ?? []), [query.data]);
  const loadError = query.isError ? describeError(query.error) : null;
  const close = () => setDialog({ kind: 'none' });

  const create = (input: ComplimentInput) => createMutation.mutate(input, { onSuccess: close });

  const createMany = (items: ComplimentInput[]) => createManyMutation.mutate(items, { onSuccess: close });

  const save = (compliment: ComplimentDto, input: ComplimentInput) =>
    updateMutation.mutate(
      {
        id: compliment.id,
        update: { ...input, isBeenPushed: compliment.isBeenPushed },
        successMessage: 'Комплимент обновлён',
      },
      { onSuccess: close },
    );

  const requeue = (compliment: ComplimentDto) =>
    updateMutation.mutate({
      id: compliment.id,
      update: { title: compliment.title, text: compliment.text, isBeenPushed: false },
      successMessage: 'Комплимент вернулся в очередь',
    });

  const remove = (compliment: ComplimentDto) => deleteMutation.mutate(compliment.id, { onSuccess: close });

  return (
    <section>
      <PageHeader
        title={query.data ? `Комплименты · ${compliments.length}` : 'Комплименты'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog({ kind: 'bulk' })}>
              Добавить списком
            </Button>
            <Button onClick={() => setDialog({ kind: 'create' })}>Добавить</Button>
          </>
        }
      />

      {query.isPending && <Spinner label="Загружаем комплименты…" />}
      {loadError && (
        <ErrorState message={loadError.message} traceId={loadError.traceId} onRetry={() => void query.refetch()} />
      )}
      {query.isSuccess && compliments.length === 0 && (
        <EmptyState title="Пока нет комплиментов. Добавьте первый или вставьте список" />
      )}
      {compliments.length > 0 && (
        <ComplimentsTable
          compliments={compliments}
          busy={updateMutation.isPending}
          onEdit={(compliment) => setDialog({ kind: 'edit', compliment })}
          onRequeue={requeue}
          onDelete={(compliment) => setDialog({ kind: 'delete', compliment })}
        />
      )}

      {dialog.kind === 'create' && (
        <ComplimentForm
          title="Новый комплимент"
          submitLabel="Сохранить"
          pending={createMutation.isPending}
          onSubmit={create}
          onClose={close}
        />
      )}
      {dialog.kind === 'bulk' && (
        <BulkImport pending={createManyMutation.isPending} onSubmit={createMany} onClose={close} />
      )}
      {dialog.kind === 'edit' && (
        <ComplimentForm
          title="Изменить комплимент"
          initial={{ title: dialog.compliment.title, text: dialog.compliment.text }}
          submitLabel="Сохранить"
          pending={updateMutation.isPending}
          onSubmit={(input) => save(dialog.compliment, input)}
          onClose={close}
        />
      )}
      {dialog.kind === 'delete' && (
        <Modal
          title="Удалить комплимент?"
          onClose={close}
          footer={
            <>
              <Button variant="secondary" onClick={close}>
                Отмена
              </Button>
              <Button variant="danger" disabled={deleteMutation.isPending} onClick={() => remove(dialog.compliment)}>
                Удалить
              </Button>
            </>
          }
        >
          <p>{`«${dialog.compliment.title}» будет удалён без возможности восстановления.`}</p>
        </Modal>
      )}
    </section>
  );
}
