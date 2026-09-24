import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/renderRoute';

describe('маршруты', () => {
  it('/ — лендинг со входом и регистрацией', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { name: 'Pulse' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/app');
    expect(screen.getByRole('link', { name: 'Зарегистрироваться' })).toHaveAttribute('href', '/auth/signup');
  });

  it('неизвестный путь — 404 со ссылкой на главную', async () => {
    renderRoute('/nope');

    expect(await screen.findByRole('heading', { name: 'Страница не найдена' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/');
  });
});
