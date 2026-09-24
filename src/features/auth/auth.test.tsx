import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { mockAuth } from '../../test/mockAuth';
import CallbackPage from './CallbackPage';
import { RequireAuth } from './RequireAuth';
import SignupRedirect from './SignupRedirect';

vi.mock('react-oidc-context', () => ({ useAuth: vi.fn() }));

function renderAt(path: string, element: ReactNode) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path.split('?')[0]} element={element} />
        <Route path="/app" element={<p>кабинет</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  it('без входа отправляет в Keycloak и запоминает страницу', async () => {
    const auth = mockAuth();

    renderAt('/app/invite?x=1', <RequireAuth><p>секрет</p></RequireAuth>);

    await waitFor(() => expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/app/invite?x=1' } }));
    expect(auth.signinRedirect).toHaveBeenCalledOnce();
    expect(screen.queryByText('секрет')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Проверяем вход…');
  });

  it('после входа показывает содержимое', () => {
    const auth = mockAuth({ isAuthenticated: true });

    renderAt('/app/invite', <RequireAuth><p>секрет</p></RequireAuth>);

    expect(screen.getByText('секрет')).toBeInTheDocument();
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('пока идёт проверка, в Keycloak не отправляет', () => {
    const auth = mockAuth({ isLoading: true });

    renderAt('/app/invite', <RequireAuth><p>секрет</p></RequireAuth>);

    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('ошибка входа — экран ошибки с повтором', () => {
    const auth = mockAuth({ error: new Error('boom') as never });

    renderAt('/app/invite', <RequireAuth><p>секрет</p></RequireAuth>);

    expect(screen.getByText('Не удалось проверить вход')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(auth.signinRedirect).toHaveBeenCalledOnce();
    expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/app/invite' } });
  });

  it('ошибка при живой сессии не закрывает страницу', () => {
    mockAuth({ isAuthenticated: true, error: new Error('renew failed') as never });

    renderAt('/app/invite', <RequireAuth><p>секрет</p></RequireAuth>);

    expect(screen.getByText('секрет')).toBeInTheDocument();
    expect(screen.queryByText('Не удалось проверить вход')).not.toBeInTheDocument();
  });
});

describe('SignupRedirect', () => {
  it('открывает регистрацию Keycloak', async () => {
    const auth = mockAuth();

    renderAt('/auth/signup', <SignupRedirect />);

    await waitFor(() =>
      expect(auth.signinRedirect).toHaveBeenCalledWith({ prompt: 'create', state: { returnTo: '/app' } }),
    );
  });

  it('уже вошедшего отправляет в кабинет', async () => {
    const auth = mockAuth({ isAuthenticated: true });

    renderAt('/auth/signup', <SignupRedirect />);

    expect(await screen.findByText('кабинет')).toBeInTheDocument();
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });
});

describe('CallbackPage', () => {
  it('пока обрабатывается ответ Keycloak — спиннер', () => {
    mockAuth({ isLoading: true });

    renderAt('/auth/callback', <CallbackPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Входим…');
  });

  it('ошибка — сообщение и повтор входа', () => {
    const auth = mockAuth({ error: new Error('invalid_grant') as never });

    renderAt('/auth/callback', <CallbackPage />);

    expect(screen.getByText('Не удалось войти')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(auth.signinRedirect).toHaveBeenCalledOnce();
  });

  it('без параметров входа — переход в кабинет', async () => {
    mockAuth();

    renderAt('/auth/callback', <CallbackPage />);

    expect(await screen.findByText('кабинет')).toBeInTheDocument();
  });
});
