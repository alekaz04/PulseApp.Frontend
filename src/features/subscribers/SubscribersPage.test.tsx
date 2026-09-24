import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authedApi } from '../../shared/api/authedApi';
import { ApiError } from '../../shared/api/http';
import { renderWithProviders } from '../../test/renderWithProviders';
import SubscribersPage from './SubscribersPage';

vi.mock('../../shared/api/authedApi', () => ({
  authedApi: {
    getCompliments: vi.fn(),
    createCompliment: vi.fn(),
    createCompliments: vi.fn(),
    updateCompliment: vi.fn(),
    deleteCompliment: vi.fn(),
    createInviteCode: vi.fn(),
    getMySubscriptions: vi.fn(),
  },
}));

const api = vi.mocked(authedApi);
const IPHONE_APP =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('SubscribersPage', () => {
  it('показывает подписчиков: активные сверху', async () => {
    api.getMySubscriptions.mockResolvedValue([
      { id: 's1', userAgent: null, createdAt: '2026-09-20T10:00:00+00:00', isActive: false },
      { id: 's2', userAgent: IPHONE_APP, createdAt: '2026-09-10T10:00:00+00:00', isActive: true },
    ]);

    renderWithProviders(<SubscribersPage />);

    expect(await screen.findByRole('heading', { name: 'Подписчики · 2' })).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]!).getByText('iPhone · веб-приложение')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Активна')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Неизвестное устройство')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Отключена')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('iPhone · веб-приложение')).toHaveAttribute('title', IPHONE_APP);
  });

  it('пустое состояние ведёт на создание ссылки', async () => {
    api.getMySubscriptions.mockResolvedValue([]);

    renderWithProviders(<SubscribersPage />);

    expect(await screen.findByText('Пока никто не подписан')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Создать ссылку' })).toHaveAttribute('href', '/app/invite');
  });

  it('ошибка загрузки и повтор', async () => {
    api.getMySubscriptions.mockRejectedValueOnce(new ApiError(0, 'x'));
    api.getMySubscriptions.mockResolvedValueOnce([]);

    renderWithProviders(<SubscribersPage />);

    expect(await screen.findByText('Нет соединения с сервером')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('Пока никто не подписан')).toBeInTheDocument();
  });
});
