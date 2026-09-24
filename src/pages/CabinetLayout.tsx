import { useAuth } from 'react-oidc-context';
import { NavLink, Outlet } from 'react-router';
import { RequireAuth } from '../features/auth/RequireAuth';
import { Button } from '../shared/ui/Button';
import styles from './CabinetLayout.module.css';

const NAV_ITEMS = [
  { to: '/app/compliments', label: 'Комплименты' },
  { to: '/app/invite', label: 'Ссылка' },
  { to: '/app/subscribers', label: 'Подписчики' },
];

export default function CabinetLayout() {
  return (
    <RequireAuth>
      <CabinetShell />
    </RequireAuth>
  );
}

export function CabinetShell() {
  const auth = useAuth();
  const profile = auth.user?.profile;
  const name = profile?.preferred_username ?? profile?.name ?? profile?.email ?? 'Автор';

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.logo}>Pulse</span>
        <div className={styles.user}>
          <span className={styles.name}>{name}</span>
          <Button variant="secondary" onClick={() => void auth.signoutRedirect()}>
            Выйти
          </Button>
        </div>
      </header>
      <nav className={styles.nav} aria-label="Разделы кабинета">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
