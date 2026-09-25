import { useId, useMemo, useState } from 'react';
import { describeError } from '../../shared/api/http';
import type { MySubscriptionDto } from '../../shared/api/types';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { Field, Select } from '../../shared/ui/Field';
import { LinkButton } from '../../shared/ui/LinkButton';
import { Modal } from '../../shared/ui/Modal';
import { Spinner } from '../../shared/ui/Spinner';
import table from '../../shared/ui/Table.module.css';
import { recipientLabel, sortSubscriptions } from '../subscribers/model';
import { useSubscriptions } from '../subscribers/queries';
import { sortForSending } from './model';
import { useCompliments } from './queries';
import styles from './SendComplimentDialog.module.css';

type SendComplimentDialogProps = {
  pending: boolean;
  onSend: (subscriptionId: string, complimentId: string) => void;
  onClose: () => void;
};

/**
 * Выбранный получатель. Пока автор ничего не выбирал, единственный активный подписчик выбирается сам.
 * Выбор автора действует, пока подписка активна: после ошибки отправки бэкенд может её отключить,
 * и тогда выбор сбрасывается, а не переходит к другому подписчику.
 */
function resolveRecipientId(picked: string | null, recipients: MySubscriptionDto[]): string {
  if (picked === null) {
    return recipients.length === 1 ? (recipients[0]?.id ?? '') : '';
  }
  return recipients.some((item) => item.id === picked) ? picked : '';
}

export function SendComplimentDialog({ pending, onSend, onClose }: SendComplimentDialogProps) {
  const recipientFieldId = useId();
  const groupName = useId();
  const subscriptionsQuery = useSubscriptions();
  const complimentsQuery = useCompliments();
  const recipients = useMemo(
    () => sortSubscriptions(subscriptionsQuery.data ?? []).filter((item) => item.isActive),
    [subscriptionsQuery.data],
  );
  const compliments = useMemo(() => sortForSending(complimentsQuery.data ?? []), [complimentsQuery.data]);
  const [pickedRecipientId, setPickedRecipientId] = useState<string | null>(null);
  const [pickedComplimentId, setPickedComplimentId] = useState<string | null>(null);

  const recipientId = resolveRecipientId(pickedRecipientId, recipients);
  const complimentId = compliments.some((item) => item.id === pickedComplimentId && !item.isBeenPushed)
    ? pickedComplimentId
    : null;
  const allSent = compliments.length > 0 && compliments.every((item) => item.isBeenPushed);
  const subscriptionsError = subscriptionsQuery.isError ? describeError(subscriptionsQuery.error) : null;
  const complimentsError = complimentsQuery.isError ? describeError(complimentsQuery.error) : null;

  return (
    <Modal
      title="Отправить комплимент"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button
            disabled={!recipientId || !complimentId || pending}
            onClick={() => recipientId && complimentId && onSend(recipientId, complimentId)}
          >
            {pending ? 'Отправляем…' : 'Отправить'}
          </Button>
        </>
      }
    >
      {subscriptionsQuery.isPending && <Spinner label="Загружаем подписчиков…" />}
      {subscriptionsError && (
        <ErrorState
          message={subscriptionsError.message}
          traceId={subscriptionsError.traceId}
          onRetry={() => void subscriptionsQuery.refetch()}
        />
      )}
      {subscriptionsQuery.isSuccess && recipients.length === 0 && (
        <EmptyState title="Нет активных подписчиков">
          <LinkButton to="/app/invite">Создать ссылку</LinkButton>
        </EmptyState>
      )}

      {recipients.length > 0 && (
        <>
          <Field label="Получатель" htmlFor={recipientFieldId} hint="Уведомление придёт сразу.">
            <Select
              id={recipientFieldId}
              value={recipientId}
              onChange={(event) => setPickedRecipientId(event.target.value)}
            >
              {(recipients.length > 1 || !recipientId) && <option value="">Выберите получателя</option>}
              {recipients.map((item) => (
                <option key={item.id} value={item.id}>
                  {recipientLabel(item)}
                </option>
              ))}
            </Select>
          </Field>

          {complimentsQuery.isPending && <Spinner label="Загружаем комплименты…" />}
          {complimentsError && (
            <ErrorState
              message={complimentsError.message}
              traceId={complimentsError.traceId}
              onRetry={() => void complimentsQuery.refetch()}
            />
          )}
          {complimentsQuery.isSuccess && compliments.length === 0 && <EmptyState title="Пока нет комплиментов" />}
          {allSent && (
            <p className={styles.hint}>
              Все комплименты уже отправлены. Чтобы отправить повторно, верните комплимент в очередь.
            </p>
          )}
          {compliments.length > 0 && (
            <div role="radiogroup" aria-label="Комплимент" className={styles.list}>
              {compliments.map((compliment) => (
                <label key={compliment.id} className={styles.option}>
                  <input
                    type="radio"
                    name={groupName}
                    value={compliment.id}
                    disabled={compliment.isBeenPushed}
                    checked={complimentId === compliment.id}
                    onChange={() => setPickedComplimentId(compliment.id)}
                  />
                  <span className={styles.content}>
                    <span className={styles.title}>{compliment.title}</span>
                    <span className={styles.text}>{compliment.text}</span>
                  </span>
                  {compliment.isBeenPushed && (
                    <span className={[table.badgeMuted, styles.badge].join(' ')}>Отправлен</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
