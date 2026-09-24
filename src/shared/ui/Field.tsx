import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  count?: number;
  max?: number;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, count, max, hint, children }: FieldProps) {
  const showCounter = count !== undefined && max !== undefined;
  return (
    <div className={styles.field}>
      <div className={styles.header}>
        <label htmlFor={htmlFor} className={styles.label}>
          {label}
        </label>
        {showCounter && (
          <span className={count > max ? styles.counterOver : styles.counter}>{`${count}/${max}`}</span>
        )}
      </div>
      {children}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[styles.control, className].filter(Boolean).join(' ')} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={[styles.control, styles.textarea, className].filter(Boolean).join(' ')} {...rest} />;
}
