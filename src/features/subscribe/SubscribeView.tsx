import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Spinner } from '../../shared/ui/Spinner';
import { IosInstallHint } from './IosInstallHint';
import type { SubscribeState } from './subscribeFlow';
import styles from './SubscribePage.module.css';

type SubscribeViewProps = {
  state: SubscribeState;
  notice: string | null;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
};

export function SubscribeView({ state, notice, onSubscribe, onUnsubscribe }: SubscribeViewProps) {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <p className={styles.brand}>Pulse</p>
        <StateContent state={state} onSubscribe={onSubscribe} onUnsubscribe={onUnsubscribe} />
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
      </Card>
    </main>
  );
}

function StateContent({ state, onSubscribe, onUnsubscribe }: Omit<SubscribeViewProps, 'notice'>) {
  switch (state.kind) {
    case 'checking':
      return <Spinner label="Проверяем браузер…" />;
    case 'working':
      return <Spinner label="Минутку…" />;
    case 'unsupported':
      return (
        <>
          <h1 className={styles.title}>Этот браузер не поддерживает уведомления</h1>
          <p className={styles.text}>
            {state.oldIos
              ? 'Обновите iOS до версии 16.4 или новее и откройте ссылку снова.'
              : 'Откройте ссылку в обычном браузере: Chrome, Firefox, Edge или Safari. Если страница открыта внутри Telegram или другого приложения, выберите «Открыть в браузере».'}
          </p>
        </>
      );
    case 'ios-install':
      return (
        <>
          <h1 className={styles.title}>Вам прислали приглашение получать комплименты</h1>
          <IosInstallHint />
        </>
      );
    case 'ready':
      return (
        <>
          <h1 className={styles.title}>Вам прислали приглашение получать комплименты</h1>
          <p className={styles.text}>
            Комплименты будут приходить уведомлениями на это устройство. Регистрироваться не нужно.
          </p>
          <Button onClick={onSubscribe}>Подписаться</Button>
        </>
      );
    case 'other-author':
      return (
        <>
          <h1 className={styles.title}>Это устройство уже получает комплименты от другого человека</h1>
          <p className={styles.text}>
            Можно получать только от одного. Если переключиться, прежние уведомления перестанут приходить.
          </p>
          <Button onClick={onSubscribe}>Переключиться</Button>
        </>
      );
    case 'denied':
      return (
        <>
          <h1 className={styles.title}>Уведомления запрещены</h1>
          <p className={styles.text}>
            Разрешите уведомления для этого сайта в настройках браузера (на iPhone: Настройки → Уведомления → Pulse) и
            нажмите «Попробовать снова».
          </p>
          <Button onClick={onSubscribe}>Попробовать снова</Button>
        </>
      );
    case 'success':
      return (
        <>
          <h1 className={styles.title}>Готово!</h1>
          <p className={styles.text}>Комплименты будут приходить уведомлениями.</p>
          <Button variant="ghost" onClick={onUnsubscribe}>
            Отписаться
          </Button>
        </>
      );
    case 'subscribed':
      return (
        <>
          <h1 className={styles.title}>Вы подписаны</h1>
          <p className={styles.text}>Комплименты приходят уведомлениями на это устройство.</p>
          <Button variant="ghost" onClick={onUnsubscribe}>
            Отписаться
          </Button>
        </>
      );
    case 'invalid-link':
      return (
        <>
          <h1 className={styles.title}>Ссылка недействительна</h1>
          <p className={styles.text}>Ссылка недействительна или уже использована. Попросите новую.</p>
        </>
      );
    case 'error':
      return (
        <>
          <h1 className={styles.title}>Не получилось</h1>
          <p className={styles.text}>{state.message}</p>
          <Button onClick={onSubscribe}>Повторить</Button>
        </>
      );
  }
}
