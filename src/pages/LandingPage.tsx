import { useState } from 'react';
import { InviteCodeForm } from '../features/subscribe/InviteCodeForm';
import { useDeviceSubscription, type DeviceStatus } from '../features/subscribe/useDeviceSubscription';
import { detectPlatform } from '../shared/push/support';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { LinkButton } from '../shared/ui/LinkButton';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const device = useDeviceSubscription();
  const [platform] = useState(() => detectPlatform());

  return (
    <LandingView
      deviceStatus={device.status}
      notice={device.notice}
      onUnsubscribe={() => void device.unsubscribe()}
      isStandalone={platform.isStandalone}
    />
  );
}

type LandingViewProps = {
  deviceStatus: DeviceStatus;
  notice: string | null;
  onUnsubscribe: () => void;
  isStandalone: boolean;
};

export function LandingView({ deviceStatus, notice, onUnsubscribe, isStandalone }: LandingViewProps) {
  return (
    <main className={styles.page}>
      {deviceStatus === 'subscribed' && (
        <Card className={styles.status}>
          <h2 className={styles.statusTitle}>Вы подписаны на комплименты</h2>
          <p className={styles.text}>Они приходят уведомлениями на это устройство.</p>
          <Button variant="ghost" onClick={onUnsubscribe}>
            Отписаться
          </Button>
        </Card>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {isStandalone && deviceStatus === 'none' && <InviteCodeForm />}
      <section className={styles.hero}>
        <h1 className={styles.logo}>Pulse</h1>
        <p className={styles.lead}>Тёплые слова близким — push-уведомлениями, в течение дня.</p>
        <div className={styles.actions}>
          <LinkButton to="/app">Войти</LinkButton>
          <LinkButton to="/auth/signup" variant="secondary">
            Зарегистрироваться
          </LinkButton>
        </div>
      </section>
    </main>
  );
}
