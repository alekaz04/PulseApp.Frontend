import { useMemo, useState } from 'react';
import { describeError } from '../../shared/api/http';
import type { MySubscriptionDto } from '../../shared/api/types';
import { formatDateTime } from '../../shared/lib/format';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LinkButton } from '../../shared/ui/LinkButton';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Spinner } from '../../shared/ui/Spinner';
import table from '../../shared/ui/Table.module.css';
import { parseUserAgent, sortSubscriptions } from './model';
import { useSendCompliment, useSubscriptions } from './queries';
import { SendComplimentDialog } from './SendComplimentDialog';
import styles from './SubscribersPage.module.css';

export default function SubscribersPage() {
  const query = useSubscriptions();
  const sendMutation = useSendCompliment();
  const [recipient, setRecipient] = useState<MySubscriptionDto | null>(null);
  const items = useMemo(() => sortSubscriptions(query.data ?? []), [query.data]);
  const loadError = query.isError ? describeError(query.error) : null;
  const close = () => setRecipient(null);

  const send = (subscription: MySubscriptionDto, complimentId: string) =>
    sendMutation.mutate({ subscriptionId: subscription.id, complimentId }, { onSuccess: close });

  return (
    <section>
      <PageHeader title={query.data ? `Подписчики · ${items.length}` : 'Подписчики'} />

      {query.isPending && <Spinner label="Загружаем подписчиков…" />}
      {loadError && (
        <ErrorState message={loadError.message} traceId={loadError.traceId} onRetry={() => void query.refetch()} />
      )}
      {query.isSuccess && items.length === 0 && (
        <EmptyState title="Пока никто не подписан">
          <LinkButton to="/app/invite">Создать ссылку</LinkButton>
        </EmptyState>
      )}
      {items.length > 0 && (
        <table className={table.table}>
          <thead>
            <tr>
              <th>Устройство</th>
              <th>Подписан</th>
              <th>Статус</th>
              <th>
                <span className={styles.hidden}>Действия</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td data-label="Устройство">
                  <span title={item.userAgent ?? undefined}>{parseUserAgent(item.userAgent)}</span>
                </td>
                <td data-label="Подписан">{formatDateTime(item.createdAt)}</td>
                <td data-label="Статус">
                  <span className={item.isActive ? table.badgeSuccess : table.badgeMuted}>
                    {item.isActive ? 'Активна' : 'Отключена'}
                  </span>
                </td>
                <td>
                  {item.isActive && (
                    <div className={table.actions}>
                      <Button variant="ghost" onClick={() => setRecipient(item)}>
                        Отправить комплимент
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {recipient && (
        <SendComplimentDialog
          recipient={parseUserAgent(recipient.userAgent)}
          pending={sendMutation.isPending}
          onSend={(complimentId) => send(recipient, complimentId)}
          onClose={close}
        />
      )}
    </section>
  );
}
