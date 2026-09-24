import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DeviceStatus } from '../features/subscribe/useDeviceSubscription';
import { LandingView } from './LandingPage';

function renderLanding(props: { deviceStatus?: DeviceStatus; isStandalone?: boolean; notice?: string | null } = {}) {
  const onUnsubscribe = vi.fn();
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <LandingView
              deviceStatus={props.deviceStatus ?? 'none'}
              notice={props.notice ?? null}
              onUnsubscribe={onUnsubscribe}
              isStandalone={props.isStandalone ?? false}
            />
          }
        />
        <Route path="/s/:code" element={<p>страница подписки</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return { onUnsubscribe };
}

afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).clipboard;
});

describe('LandingView', () => {
  it('всегда предлагает вход и регистрацию', () => {
    renderLanding();

    expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/app');
    expect(screen.getByRole('link', { name: 'Зарегистрироваться' })).toHaveAttribute('href', '/auth/signup');
    expect(screen.queryByText('Вы подписаны на комплименты')).not.toBeInTheDocument();
  });

  it('подписанное устройство видит статус и может отписаться', () => {
    const { onUnsubscribe } = renderLanding({ deviceStatus: 'subscribed' });

    expect(screen.getByRole('heading', { name: 'Вы подписаны на комплименты' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Отписаться' }));
    expect(onUnsubscribe).toHaveBeenCalledOnce();
  });

  it('в браузере поле для кода не показывается', () => {
    renderLanding({ isStandalone: false });
    expect(screen.queryByLabelText('Вставьте ссылку или код приглашения')).not.toBeInTheDocument();
  });

  it('в установленном приложении без подписки вставленная ссылка ведёт на страницу подписки', async () => {
    renderLanding({ isStandalone: true });

    fireEvent.change(screen.getByLabelText('Вставьте ссылку или код приглашения'), {
      target: { value: 'https://pulse.lvakarin.ru/s/3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(await screen.findByText('страница подписки')).toBeInTheDocument();
  });

  it('непохожий текст — ошибка', () => {
    renderLanding({ isStandalone: true });

    fireEvent.change(screen.getByLabelText('Вставьте ссылку или код приглашения'), { target: { value: 'привет' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Не похоже на ссылку Pulse. Вставьте ссылку целиком.');
  });

  it('вставляет ссылку из буфера', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: vi.fn(async () => 'https://pulse.lvakarin.ru/s/CODE-1234') },
      configurable: true,
    });
    renderLanding({ isStandalone: true });

    fireEvent.click(screen.getByRole('button', { name: 'Вставить из буфера' }));

    expect(await screen.findByDisplayValue('https://pulse.lvakarin.ru/s/CODE-1234')).toBeInTheDocument();
  });
});
