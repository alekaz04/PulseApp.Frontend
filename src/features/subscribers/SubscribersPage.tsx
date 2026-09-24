import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { authedApi } from '../../shared/api/authedApi';
import { describeError } from '../../shared/api/http';
import { formatDateTime } from '../../shared/lib/format';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LinkButton } from '../../shared/ui/LinkButton';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Spinner } from '../../shared/ui/Spinner';
import table from '../../shared/ui/Table.module.css';
import { parseUserAgent, sortSubscriptions } from './model';

export default function SubscribersPage() {
  const query = useQuery({ queryKey: ['subscriptions'], queryFn: () => authedApi.getMySubscriptions() });
  const items = useMemo(() => sortSubscriptions(query.data ?? []), [query.data]);
  const loadError = query.isError ? describeError(query.error) : null;

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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
