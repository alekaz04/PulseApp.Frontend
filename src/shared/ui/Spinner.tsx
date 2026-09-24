import styles from './Spinner.module.css';

export function Spinner({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className={styles.wrapper} role="status">
      <span className={styles.circle} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className={styles.fullPage}>
      <Spinner label={label} />
    </div>
  );
}
