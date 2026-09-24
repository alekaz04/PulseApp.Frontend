import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { authedApi } from '../../shared/api/authedApi';
import { describeError } from '../../shared/api/http';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { PageHeader } from '../../shared/ui/PageHeader';
import { useToast } from '../../shared/ui/toastContext';
import { buildInviteUrl } from './buildInviteUrl';
import styles from './InvitePage.module.css';

export default function InvitePage() {
  const toast = useToast();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const canShare = typeof navigator.share === 'function';

  const create = useMutation({
    mutationFn: () => authedApi.createInviteCode(),
    onSuccess: (code) => setUrl(buildInviteUrl(window.location.origin, code)),
    onError: (error) => {
      const { message, traceId } = describeError(error);
      toast.show(message, { type: 'error', traceId });
    },
  });

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.show('Ссылка скопирована', { type: 'success' });
    } catch {
      fieldRef.current?.focus();
      fieldRef.current?.select();
      toast.show('Не удалось скопировать автоматически — ссылка выделена, скопируйте её вручную', { type: 'info' });
    }
  };

  const share = async () => {
    if (!url) return;
    try {
      await navigator.share({ title: 'Pulse', text: 'Подпишись на мои комплименты', url });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.show('Не удалось поделиться ссылкой', { type: 'error' });
      }
    }
  };

  return (
    <section className={styles.page}>
      <PageHeader title="Ссылка-приглашение" />
      <p className={styles.lead}>
        Отправьте ссылку человеку, которому хотите дарить комплименты. Он откроет её и подпишется на уведомления —
        регистрироваться ему не нужно.
      </p>

      <div>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? 'Создаём…' : url ? 'Создать новую ссылку' : 'Создать ссылку'}
        </Button>
      </div>

      {url && (
        <Card className={styles.result}>
          <label htmlFor="invite-url" className={styles.label}>
            Ваша ссылка
          </label>
          <textarea id="invite-url" ref={fieldRef} className={styles.url} readOnly rows={2} value={url} />
          <div className={styles.actions}>
            <Button onClick={() => void copy()}>Скопировать</Button>
            {canShare && (
              <Button variant="secondary" onClick={() => void share()}>
                Поделиться
              </Button>
            )}
          </div>
        </Card>
      )}

      <p className={styles.hint}>
        Ссылка одноразовая и действует 24 часа. Для каждого человека и устройства создайте новую. Ссылка не
        сохраняется: если уйти со страницы, создайте новую.
      </p>
    </section>
  );
}
