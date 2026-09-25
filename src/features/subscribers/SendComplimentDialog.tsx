import { useId, useMemo, useState } from 'react';
import { describeError } from '../../shared/api/http';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LinkButton } from '../../shared/ui/LinkButton';
import { Modal } from '../../shared/ui/Modal';
import { Spinner } from '../../shared/ui/Spinner';
import { sortByNewest } from '../compliments/model';
import { useCompliments } from '../compliments/queries';
import styles from './SendComplimentDialog.module.css';

type SendComplimentDialogProps = {
  recipient: string;
  pending: boolean;
  onSend: (complimentId: string) => void;
  onClose: () => void;
};

export function SendComplimentDialog({ recipient, pending, onSend, onClose }: SendComplimentDialogProps) {
  const groupName = useId();
  const query = useCompliments();
  const compliments = useMemo(() => sortByNewest(query.data ?? []), [query.data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const loadError = query.isError ? describeError(query.error) : null;

  return (
    <Modal
      title="Отправить комплимент"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button disabled={!selectedId || pending} onClick={() => selectedId && onSend(selectedId)}>
            {pending ? 'Отправляем…' : 'Отправить'}
          </Button>
        </>
      }
    >
      <p className={styles.recipient}>
        Получатель: <strong>{recipient}</strong>. Уведомление придёт сразу.
      </p>

      {query.isPending && <Spinner label="Загружаем комплименты…" />}
      {loadError && (
        <ErrorState message={loadError.message} traceId={loadError.traceId} onRetry={() => void query.refetch()} />
      )}
      {query.isSuccess && compliments.length === 0 && (
        <EmptyState title="Пока нет комплиментов">
          <LinkButton to="/app/compliments">Добавить комплименты</LinkButton>
        </EmptyState>
      )}
      {compliments.length > 0 && (
        <div role="radiogroup" aria-label="Комплимент" className={styles.list}>
          {compliments.map((compliment) => (
            <label key={compliment.id} className={styles.option}>
              <input
                type="radio"
                name={groupName}
                value={compliment.id}
                checked={selectedId === compliment.id}
                onChange={() => setSelectedId(compliment.id)}
              />
              <span className={styles.content}>
                <span className={styles.title}>{compliment.title}</span>
                <span className={styles.text}>{compliment.text}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}
