import { Link, type LinkProps } from 'react-router';
import type { ButtonVariant } from './Button';
import styles from './Button.module.css';

export function LinkButton({ variant = 'primary', className, ...rest }: LinkProps & { variant?: ButtonVariant }) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  return <Link className={classes} {...rest} />;
}
