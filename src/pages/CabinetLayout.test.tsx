import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { mockAuth } from '../test/mockAuth';
import CabinetLayout, { CabinetShell } from './CabinetLayout';

vi.mock('react-oidc-context', () => ({ useAuth: vi.fn() }));

describe('CabinetShell', () => {
  it('показывает имя автора, разделы и выход', () => {
    const auth = mockAuth({
      isAuthenticated: true,
      user: { profile: { preferred_username: 'masha' } } as never,
    });

    render(
      <MemoryRouter initialEntries={['/app/compliments']}>
        <CabinetShell />
      </MemoryRouter>,
    );

    expect(screen.getByText('masha')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Разделы кабинета' });
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Комплименты' }));
    expect(screen.getByRole('link', { name: 'Комплименты' })).toHaveAttribute('href', '/app/compliments');
    expect(screen.getByRole('link', { name: 'Ссылка' })).toHaveAttribute('href', '/app/invite');
    expect(screen.getByRole('link', { name: 'Подписчики' })).toHaveAttribute('href', '/app/subscribers');
    expect(screen.getByRole('link', { name: 'Комплименты' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(auth.signoutRedirect).toHaveBeenCalledOnce();
  });

  it('без имени в токене — «Автор»', () => {
    mockAuth({ isAuthenticated: true, user: { profile: {} } as never });

    render(
      <MemoryRouter>
        <CabinetShell />
      </MemoryRouter>,
    );

    expect(screen.getByText('Автор')).toBeInTheDocument();
  });
});

describe('CabinetLayout', () => {
  it('без входа отправляет в Keycloak', async () => {
    const auth = mockAuth();

    render(
      <MemoryRouter initialEntries={['/app/compliments']}>
        <CabinetLayout />
      </MemoryRouter>,
    );

    await waitFor(() => expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/app/compliments' } }));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
