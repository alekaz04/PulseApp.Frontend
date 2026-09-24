import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authedApi } from '../../shared/api/authedApi';
import { ApiError } from '../../shared/api/http';
import { renderWithProviders } from '../../test/renderWithProviders';
import InvitePage from './InvitePage';

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
const CODE = '3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b';
const URL_WITH_CODE = `http://localhost:3000/s/${CODE}`;

function stubNavigator(name: 'clipboard' | 'share', value: unknown) {
  Object.defineProperty(navigator, name, { value, configurable: true });
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).clipboard;
  delete (navigator as unknown as Record<string, unknown>).share;
});

async function createLink() {
  api.createInviteCode.mockResolvedValue(CODE);
  renderWithProviders(<InvitePage />);
  fireEvent.click(screen.getByRole('button', { name: 'Создать ссылку' }));
  return screen.findByLabelText('Ваша ссылка');
}

describe('InvitePage', () => {
  it('создаёт ссылку и объясняет, что она одноразовая', async () => {
    const field = await createLink();

    expect(field).toHaveValue(URL_WITH_CODE);
    expect(
      screen.getByText(
        'Ссылка одноразовая и действует 24 часа. Для каждого человека и устройства создайте новую. Ссылка не сохраняется: если уйти со страницы, создайте новую.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Создать новую ссылку' })).toBeInTheDocument();
  });

  it('копирует ссылку', async () => {
    const writeText = vi.fn(async () => undefined);
    stubNavigator('clipboard', { writeText });
    await createLink();

    fireEvent.click(screen.getByRole('button', { name: 'Скопировать' }));

    expect(await screen.findByText('Ссылка скопирована')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(URL_WITH_CODE);
  });

  it('если копирование не удалось — выделяет ссылку для ручного копирования', async () => {
    stubNavigator('clipboard', { writeText: vi.fn(async () => Promise.reject(new Error('denied'))) });
    const field = (await createLink()) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: 'Скопировать' }));

    expect(
      await screen.findByText('Не удалось скопировать автоматически — ссылка выделена, скопируйте её вручную'),
    ).toBeInTheDocument();
    expect(field).toHaveFocus();
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(URL_WITH_CODE.length);
  });

  it('без navigator.share кнопки «Поделиться» нет', async () => {
    await createLink();
    expect(screen.queryByRole('button', { name: 'Поделиться' })).not.toBeInTheDocument();
  });

  it('«Поделиться» передаёт ссылку в системное меню', async () => {
    const share = vi.fn(async () => undefined);
    stubNavigator('share', share);
    await createLink();

    fireEvent.click(screen.getByRole('button', { name: 'Поделиться' }));

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({ title: 'Pulse', text: 'Подпишись на мои комплименты', url: URL_WITH_CODE }),
    );
  });

  it('ошибка API — тост', async () => {
    api.createInviteCode.mockRejectedValue(new ApiError(500, 'Internal Server Error', 't-7'));
    renderWithProviders(<InvitePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Создать ссылку' }));

    expect(await screen.findByText('Ошибка сервера. Попробуйте позже')).toBeInTheDocument();
    expect(screen.getByText('Код: t-7')).toBeInTheDocument();
  });
});
