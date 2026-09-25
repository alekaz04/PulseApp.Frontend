import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authedApi } from '../../shared/api/authedApi';
import { ApiError } from '../../shared/api/http';
import type { ComplimentDto, MySubscriptionDto } from '../../shared/api/types';
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
    sendCompliment: vi.fn(),
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

const IPHONE_APP =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

function subscription(overrides: Partial<MySubscriptionDto> = {}): MySubscriptionDto {
  return {
    id: 's1',
    name: 'Маша',
    userAgent: IPHONE_APP,
    createdAt: '2026-09-10T10:00:00+00:00',
    isActive: true,
    ...overrides,
  };
}

async function openSendDialog(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: /^Комплименты · / });
  await user.click(screen.getByRole('button', { name: 'Отправить' }));
  return screen.getByRole('dialog', { name: 'Отправить комплимент' });
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

describe('ComplimentsPage: отправка одного комплимента', () => {
  it('отправляет выбранный комплимент выбранному получателю и перечитывает списки', async () => {
    api.getMySubscriptions.mockResolvedValue([
      subscription({ id: 'sub-masha', name: 'Маша', createdAt: '2026-09-10T10:00:00+00:00' }),
      subscription({ id: 'sub-petya', name: 'Петя', createdAt: '2026-09-01T10:00:00+00:00' }),
    ]);
    api.getCompliments.mockResolvedValue([
      compliment({ id: 'c-old', title: 'Старый', createdAt: '2026-09-01T10:00:00+00:00' }),
      compliment({ id: 'c-new', title: 'Новый', createdAt: '2026-09-10T10:00:00+00:00' }),
    ]);
    api.sendCompliment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    const recipient = await within(dialog).findByLabelText('Получатель');
    expect(recipient).toHaveValue('');
    expect(within(recipient).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Выберите получателя',
      'Маша · iPhone · веб-приложение',
      'Петя · iPhone · веб-приложение',
    ]);
    const radios = await within(dialog).findAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['c-new', 'c-old']);
    const send = within(dialog).getByRole('button', { name: 'Отправить' });
    expect(send).toBeDisabled();

    await user.selectOptions(recipient, 'sub-petya');
    await user.click(within(dialog).getByRole('radio', { name: /Старый/ }));
    const complimentsBefore = api.getCompliments.mock.calls.length;
    const subscriptionsBefore = api.getMySubscriptions.mock.calls.length;
    await user.click(send);

    await waitFor(() => expect(api.sendCompliment).toHaveBeenCalledWith('sub-petya', 'c-old'));
    expect(await screen.findByText('Комплимент отправлен')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.getCompliments.mock.calls.length).toBeGreaterThan(complimentsBefore);
    expect(api.getMySubscriptions.mock.calls.length).toBeGreaterThan(subscriptionsBefore);
  });

  it('отправленные комплименты недоступны и стоят в конце', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([
      compliment({ id: 'sent', title: 'Обед', isBeenPushed: true, createdAt: '2026-09-20T10:00:00+00:00' }),
      compliment({ id: 'queued', title: 'Утро', createdAt: '2026-09-01T10:00:00+00:00' }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    const radios = await within(dialog).findAllByRole('radio');

    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['queued', 'sent']);
    expect(within(dialog).getByRole('radio', { name: /Обед/ })).toBeDisabled();
    expect(within(dialog).getByRole('radio', { name: /Утро/ })).toBeEnabled();
    expect(within(dialog).getByText('Отправлен')).toBeInTheDocument();
  });

  it('единственный активный получатель выбран сразу', async () => {
    api.getMySubscriptions.mockResolvedValue([
      subscription({ id: 'sub-1', name: 'Маша' }),
      subscription({ id: 'sub-off', name: 'Петя', isActive: false }),
    ]);
    api.getCompliments.mockResolvedValue([compliment({ id: 'c1' })]);
    api.sendCompliment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    const recipient = await within(dialog).findByLabelText('Получатель');
    expect(recipient).toHaveValue('sub-1');
    expect(within(recipient).getAllByRole('option')).toHaveLength(1);

    await user.click(await within(dialog).findByRole('radio', { name: /Утро/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Отправить' }));

    await waitFor(() => expect(api.sendCompliment).toHaveBeenCalledWith('sub-1', 'c1'));
  });

  it('без комплиментов — пустое состояние без ссылки', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);

    expect(await within(dialog).findByText('Пока нет комплиментов')).toBeInTheDocument();
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  it('без активных подписчиков предлагает создать ссылку', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription({ isActive: false })]);
    api.getCompliments.mockResolvedValue([compliment()]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);

    expect(await within(dialog).findByText('Нет активных подписчиков')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Создать ссылку' })).toHaveAttribute('href', '/app/invite');
    expect(within(dialog).queryByRole('radio')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  // Review Focus 5
  it('все комплименты отправлены — подсказка, отправить нельзя', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([compliment({ isBeenPushed: true })]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);

    expect(
      await within(dialog).findByText(
        'Все комплименты уже отправлены. Чтобы отправить повторно, верните комплимент в очередь.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /Утро/ })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  it('ошибка отправки — тост с кодом, окно остаётся открытым', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([compliment()]);
    api.sendCompliment.mockRejectedValue(new ApiError(400, 'Subscription not found or it is not active', 'trace-7'));
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    await user.click(await within(dialog).findByRole('radio', { name: /Утро/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Отправить' }));

    expect(await screen.findByText('Subscription not found or it is not active')).toBeInTheDocument();
    expect(screen.getByText('Код: trace-7')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Отправить комплимент' })).toBeInTheDocument();
  });

  // Review Focus 1
  it('получатель, отключённый после ошибки, пропадает, а выбор сбрасывается', async () => {
    api.getMySubscriptions
      .mockResolvedValueOnce([subscription({ id: 'sub-1', name: 'Маша' }), subscription({ id: 'sub-2', name: 'Петя' })])
      .mockResolvedValue([
        subscription({ id: 'sub-1', name: 'Маша', isActive: false }),
        subscription({ id: 'sub-2', name: 'Петя' }),
      ]);
    api.getCompliments.mockResolvedValue([compliment({ id: 'c1' })]);
    api.sendCompliment.mockRejectedValue(new ApiError(400, 'Subscription not found or it is not active', 't-2'));
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    await user.selectOptions(await within(dialog).findByLabelText('Получатель'), 'sub-1');
    await user.click(await within(dialog).findByRole('radio', { name: /Утро/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Отправить' }));

    expect(await screen.findByText('Subscription not found or it is not active')).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).queryByRole('option', { name: /Маша/ })).not.toBeInTheDocument());
    expect(within(dialog).getByLabelText('Получатель')).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  // Review Focus 4
  it('ошибка загрузки подписчиков — повтор', async () => {
    api.getMySubscriptions.mockRejectedValueOnce(new ApiError(0, 'x'));
    api.getMySubscriptions.mockResolvedValueOnce([subscription()]);
    api.getCompliments.mockResolvedValue([compliment()]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);

    expect(await within(dialog).findByText('Нет соединения с сервером')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Повторить' }));
    expect(await within(dialog).findByLabelText('Получатель')).toHaveValue('s1');
  });
});
