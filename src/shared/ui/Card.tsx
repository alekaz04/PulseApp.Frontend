import type { ReactNode } from 'react';
import styles from './Card.module.css';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={[styles.card, className].filter(Boolean).join(' ')}>{children}</div>;
}
