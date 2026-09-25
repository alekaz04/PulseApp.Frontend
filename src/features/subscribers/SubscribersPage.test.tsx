import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authedApi } from '../../shared/api/authedApi';
import { ApiError } from '../../shared/api/http';
import type { ComplimentDto, MySubscriptionDto } from '../../shared/api/types';
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
    sendCompliment: vi.fn(),
  },
}));

const api = vi.mocked(authedApi);
const IPHONE_APP =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

function subscription(overrides: Partial<MySubscriptionDto> = {}): MySubscriptionDto {
  return { id: 's1', userAgent: IPHONE_APP, createdAt: '2026-09-10T10:00:00+00:00', isActive: true, ...overrides };
}

function compliment(overrides: Partial<ComplimentDto> = {}): ComplimentDto {
  return {
    id: 'c1',
    title: 'Утро',
    text: 'Ты лучше всех',
    isBeenPushed: false,
    createdAt: '2026-09-20T10:00:00+00:00',
    updatedAt: '2026-09-20T10:00:00+00:00',
    ...overrides,
  };
}

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

  it('кнопка отправки есть только у активных подписок', async () => {
    api.getMySubscriptions.mockResolvedValue([
      subscription({ id: 'active' }),
      subscription({ id: 'inactive', isActive: false }),
    ]);

    renderWithProviders(<SubscribersPage />);

    await screen.findByRole('heading', { name: 'Подписчики · 2' });
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]!).getByRole('button', { name: 'Отправить комплимент' })).toBeInTheDocument();
    expect(within(rows[2]!).queryByRole('button', { name: 'Отправить комплимент' })).not.toBeInTheDocument();
  });

  it('отправляет выбранный комплимент подписчику и обновляет список', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription({ id: 'sub-1' })]);
    api.getCompliments.mockResolvedValue([
      compliment({ id: 'c-old', title: 'Старый', createdAt: '2026-09-01T10:00:00+00:00' }),
      compliment({ id: 'c-new', title: 'Новый', createdAt: '2026-09-10T10:00:00+00:00' }),
    ]);
    api.sendCompliment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<SubscribersPage />);

    await user.click(await screen.findByRole('button', { name: 'Отправить комплимент' }));
    const dialog = screen.getByRole('dialog', { name: 'Отправить комплимент' });
    expect(within(dialog).getByText('iPhone · веб-приложение')).toBeInTheDocument();
    const radios = await within(dialog).findAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['c-new', 'c-old']);
    const send = within(dialog).getByRole('button', { name: 'Отправить' });
    expect(send).toBeDisabled();

    await user.click(within(dialog).getByRole('radio', { name: /Старый/ }));
    await user.click(send);

    await waitFor(() => expect(api.sendCompliment).toHaveBeenCalledWith('sub-1', 'c-old'));
    expect(await screen.findByText('Комплимент отправлен')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(api.getMySubscriptions).toHaveBeenCalledTimes(2));
  });

  it('ошибка отправки — тост с кодом, окно остаётся открытым', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([compliment()]);
    api.sendCompliment.mockRejectedValue(new ApiError(400, 'Subscription not found or it is not active', 'trace-7'));
    const user = userEvent.setup();
    renderWithProviders(<SubscribersPage />);

    await user.click(await screen.findByRole('button', { name: 'Отправить комплимент' }));
    const dialog = screen.getByRole('dialog', { name: 'Отправить комплимент' });
    await user.click(await within(dialog).findByRole('radio', { name: /Утро/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Отправить' }));

    expect(await screen.findByText('Subscription not found or it is not active')).toBeInTheDocument();
    expect(screen.getByText('Код: trace-7')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Отправить комплимент' })).toBeInTheDocument();
  });

  it('без комплиментов предлагает их добавить', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<SubscribersPage />);

    await user.click(await screen.findByRole('button', { name: 'Отправить комплимент' }));
    const dialog = screen.getByRole('dialog', { name: 'Отправить комплимент' });

    expect(await within(dialog).findByText('Пока нет комплиментов')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Добавить комплименты' })).toHaveAttribute(
      'href',
      '/app/compliments',
    );
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });
});
