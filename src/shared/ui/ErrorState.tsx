import { Button } from './Button';
import styles from './States.module.css';

type ErrorStateProps = {
  message: string;
  traceId?: string | null;
  onRetry?: () => void;
};

export function ErrorState({ message, traceId, onRetry }: ErrorStateProps) {
  return (
    <div className={`${styles.box} ${styles.error}`}>
      <p className={styles.title}>{message}</p>
      {traceId && <p className={styles.trace}>{`Код: ${traceId}`}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
