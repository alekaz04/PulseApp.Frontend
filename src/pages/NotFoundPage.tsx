import { LinkButton } from '../shared/ui/LinkButton';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <main className={styles.root}>
      <h1 className={styles.title}>Страница не найдена</h1>
      <p>Проверьте адрес или вернитесь на главную.</p>
      <LinkButton to="/" variant="secondary">
        На главную
      </LinkButton>
    </main>
  );
}
