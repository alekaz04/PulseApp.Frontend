import { LinkButton } from '../shared/ui/LinkButton';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  return (
    <main className={styles.page}>
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
