import type { ReactNode } from 'react';
import styles from './States.module.css';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.box}>
      <p className={styles.title}>{title}</p>
      {children}
    </div>
  );
}
