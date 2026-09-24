import { useState } from 'react';
import { Button } from '../../shared/ui/Button';
import styles from './SubscribePage.module.css';

export function IosInstallHint() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const url = window.location.href;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div className={styles.hint}>
      <p className={styles.text}>На iPhone уведомления работают, только если добавить Pulse на экран «Домой»:</p>
      <ol className={styles.steps}>
        <li>
          Если ссылка открыта внутри Telegram, WhatsApp или другого приложения, сначала откройте её в Safari (меню
          «…» → «Открыть в Safari»).
        </li>
        <li>Нажмите «Поделиться» внизу экрана.</li>
        <li>Выберите «На экран „Домой“».</li>
        <li>Откройте Pulse с экрана «Домой» и нажмите «Подписаться».</li>
      </ol>
      <Button variant="secondary" onClick={() => void copy()}>
        Скопировать ссылку
      </Button>
      {copyState === 'copied' && (
        <p className={styles.small} role="status">
          Ссылка скопирована. Если после установки приложение откроется без приглашения, вставьте её на главном экране
          Pulse.
        </p>
      )}
      {copyState === 'failed' && (
        <p className={styles.small} role="status">
          Скопируйте ссылку вручную: <span className={styles.url}>{url}</span>
        </p>
      )}
    </div>
  );
}
