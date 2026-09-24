import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authedApi } from '../../shared/api/authedApi';
import { ApiError } from '../../shared/api/http';
import type { ComplimentDto } from '../../shared/api/types';
import { renderWithProviders } from '../../test/renderWithProviders';
import ComplimentsPage from './ComplimentsPage';

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

function compliment(overrides: Partial<ComplimentDto> = {}): ComplimentDto {
  return {
    id: 'id-1',
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

describe('ComplimentsPage', () => {
  it('показывает комплименты новыми сверху и счётчик', async () => {
    api.getCompliments.mockResolvedValue([
      compliment({ id: 'old', title: 'Старый', createdAt: '2026-09-01T10:00:00+00:00' }),
      compliment({ id: 'new', title: 'Новый', createdAt: '2026-09-10T10:00:00+00:00', isBeenPushed: true }),
    ]);

    renderWithProviders(<ComplimentsPage />);

    expect(await screen.findByRole('heading', { name: 'Комплименты · 2' })).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]!).getByText('Новый')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Отправлен')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Старый')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('В очереди')).toBeInTheDocument();
  });

  it('пустое состояние', async () => {
    api.getCompliments.mockResolvedValue([]);

    renderWithProviders(<ComplimentsPage />);

    expect(await screen.findByText('Пока нет комплиментов. Добавьте первый или вставьте список')).toBeInTheDocument();
  });

  it('ошибка загрузки и повтор', async () => {
    api.getCompliments.mockRejectedValueOnce(new ApiError(500, 'Internal Server Error', 't-1'));
    api.getCompliments.mockResolvedValueOnce([]);
    const user = userEvent.setup();

    renderWithProviders(<ComplimentsPage />);

    expect(await screen.findByText('Ошибка сервера. Попробуйте позже')).toBeInTheDocument();
    expect(screen.getByText('Код: t-1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('Пока нет комплиментов. Добавьте первый или вставьте список')).toBeInTheDocument();
  });

  it('добавляет комплимент с обрезанными пробелами и обновляет список', async () => {
    api.getCompliments.mockResolvedValue([]);
    api.createCompliment.mockResolvedValue('new-id');
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);
    await screen.findByRole('heading', { name: 'Комплименты · 0' });

    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    const dialog = screen.getByRole('dialog', { name: 'Новый комплимент' });
    await user.type(within(dialog).getByLabelText('Заголовок'), '  Привет  ');
    await user.type(within(dialog).getByLabelText('Текст'), 'Ты лучше всех');
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(api.createCompliment).toHaveBeenCalledWith({ title: 'Привет', text: 'Ты лучше всех' }));
    expect(await screen.findByText('Комплимент добавлен')).toBeInTheDocument();
    await waitFor(() => expect(api.getCompliments).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('не отправляет пустую форму', async () => {
    api.getCompliments.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);
    await screen.findByRole('heading', { name: 'Комплименты · 0' });

    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    const dialog = screen.getByRole('dialog', { name: 'Новый комплимент' });
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }));

    expect(within(dialog).getByText('Введите заголовок')).toBeInTheDocument();
    expect(within(dialog).getByText('Введите текст')).toBeInTheDocument();
    expect(api.createCompliment).not.toHaveBeenCalled();
  });

  it('ошибка сохранения — тост с кодом, окно остаётся открытым', async () => {
    api.getCompliments.mockResolvedValue([]);
    api.createCompliment.mockRejectedValue(new ApiError(400, 'Слишком длинный текст', 'trace-9'));
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);
    await screen.findByRole('heading', { name: 'Комплименты · 0' });

    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    const dialog = screen.getByRole('dialog', { name: 'Новый комплимент' });
    await user.type(within(dialog).getByLabelText('Заголовок'), 'Привет');
    await user.type(within(dialog).getByLabelText('Текст'), 'Текст');
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByText('Слишком длинный текст')).toBeInTheDocument();
    expect(screen.getByText('Код: trace-9')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Новый комплимент' })).toBeInTheDocument();
  });

  it('редактирует, сохраняя статус отправки', async () => {
    api.getCompliments.mockResolvedValue([compliment({ isBeenPushed: true })]);
    api.updateCompliment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    await user.click(await screen.findByRole('button', { name: 'Изменить «Утро»' }));
    const dialog = screen.getByRole('dialog', { name: 'Изменить комплимент' });
    expect(within(dialog).getByLabelText('Заголовок')).toHaveValue('Утро');
    const text = within(dialog).getByLabelText('Текст');
    await user.clear(text);
    await user.type(text, 'Новый текст');
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }));

    await waitFor(() =>
      expect(api.updateCompliment).toHaveBeenCalledWith('id-1', {
        title: 'Утро',
        text: 'Новый текст',
        isBeenPushed: true,
      }),
    );
    expect(await screen.findByText('Комплимент обновлён')).toBeInTheDocument();
  });

  it('возвращает отправленный комплимент в очередь', async () => {
    api.getCompliments.mockResolvedValue([
      compliment({ isBeenPushed: true }),
      compliment({ id: 'id-2', title: 'Вечер', isBeenPushed: false }),
    ]);
    api.updateCompliment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    await user.click(await screen.findByRole('button', { name: 'Вернуть в очередь «Утро»' }));

    await waitFor(() =>
      expect(api.updateCompliment).toHaveBeenCalledWith('id-1', {
        title: 'Утро',
        text: 'Ты лучше всех',
        isBeenPushed: false,
      }),
    );
    expect(await screen.findByText('Комплимент вернулся в очередь')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть в очередь «Вечер»' })).not.toBeInTheDocument();
  });

  it('удаляет после подтверждения', async () => {
    api.getCompliments.mockResolvedValue([compliment()]);
    api.deleteCompliment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    await user.click(await screen.findByRole('button', { name: 'Удалить «Утро»' }));
    const dialog = screen.getByRole('dialog', { name: 'Удалить комплимент?' });
    expect(within(dialog).getByText('«Утро» будет удалён без возможности восстановления.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }));

    await waitFor(() => expect(api.deleteCompliment).toHaveBeenCalledWith('id-1'));
    expect(await screen.findByText('Комплимент удалён')).toBeInTheDocument();
  });

  it('добавляет комплименты списком', async () => {
    api.getCompliments.mockResolvedValue([]);
    api.createCompliments.mockResolvedValue(['a', 'b']);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);
    await screen.findByRole('heading', { name: 'Комплименты · 0' });

    await user.click(screen.getByRole('button', { name: 'Добавить списком' }));
    const dialog = screen.getByRole('dialog', { name: 'Добавить списком' });
    await user.type(within(dialog).getByLabelText('Тексты, по одному на строку'), 'Первый{enter}Второй');
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }));

    await waitFor(() =>
      expect(api.createCompliments).toHaveBeenCalledWith([
        { title: 'Комплимент для тебя 💌', text: 'Первый' },
        { title: 'Комплимент для тебя 💌', text: 'Второй' },
      ]),
    );
    expect(await screen.findByText('Добавлено: 2')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
