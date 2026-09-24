import { useRouteError } from 'react-router';
import { Button } from '../shared/ui/Button';
import styles from './RouteError.module.css';

export function RouteError() {
  const error = useRouteError();
  const details = error instanceof Error ? error.message : null;

  return (
    <main className={styles.root} role="alert">
      <h1 className={styles.title}>Что-то пошло не так</h1>
      <p>Обновите страницу. Если ошибка повторяется, попробуйте позже.</p>
      {details && <p className={styles.details}>{details}</p>}
      <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
    </main>
  );
}
