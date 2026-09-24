import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IosInstallHint } from './IosInstallHint';
import type { SubscribeState } from './subscribeFlow';
import { SubscribeView } from './SubscribeView';

function renderView(state: SubscribeState, notice: string | null = null) {
  const onSubscribe = vi.fn();
  const onUnsubscribe = vi.fn();
  render(<SubscribeView state={state} notice={notice} onSubscribe={onSubscribe} onUnsubscribe={onUnsubscribe} />);
  return { onSubscribe, onUnsubscribe };
}

afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).clipboard;
});

describe('SubscribeView', () => {
  it.each<[SubscribeState, string, string | null]>([
    [{ kind: 'ready' }, 'Вам прислали приглашение получать комплименты', 'Подписаться'],
    [{ kind: 'other-author' }, 'Это устройство уже получает комплименты от другого человека', 'Переключиться'],
    [{ kind: 'denied' }, 'Уведомления запрещены', 'Попробовать снова'],
    [{ kind: 'error', message: 'Сервер временно недоступен. Попробуйте ещё раз.' }, 'Не получилось', 'Повторить'],
  ])('%o: заголовок и кнопка подписки', (state, heading, button) => {
    const { onSubscribe } = renderView(state);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: button! }));
    expect(onSubscribe).toHaveBeenCalledOnce();
  });

  it.each<[SubscribeState, string]>([
    [{ kind: 'success' }, 'Готово!'],
    [{ kind: 'subscribed' }, 'Вы подписаны'],
  ])('%o: можно отписаться', (state, heading) => {
    const { onUnsubscribe } = renderView(state);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Отписаться' }));
    expect(onUnsubscribe).toHaveBeenCalledOnce();
  });

  it('недействительная ссылка — без кнопок', () => {
    renderView({ kind: 'invalid-link' });

    expect(screen.getByText('Ссылка недействительна или уже использована. Попросите новую.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('старый iOS — просьба обновиться', () => {
    renderView({ kind: 'unsupported', oldIos: true });

    expect(screen.getByRole('heading', { name: 'Этот браузер не поддерживает уведомления' })).toBeInTheDocument();
    expect(screen.getByText('Обновите iOS до версии 16.4 или новее и откройте ссылку снова.')).toBeInTheDocument();
  });

  it('проверка и работа — спиннер без кнопок', () => {
    renderView({ kind: 'working' });

    expect(screen.getByRole('status')).toHaveTextContent('Минутку…');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('показывает предупреждение', () => {
    renderView({ kind: 'ready' }, 'Уведомления на этом устройстве отключены, но сервер не подтвердил отписку.');

    expect(screen.getByText('Уведомления на этом устройстве отключены, но сервер не подтвердил отписку.')).toBeInTheDocument();
  });
});

describe('IosInstallHint', () => {
  // Review Focus 3
  it('первым шагом просит открыть ссылку в Safari, если она открыта в Telegram или другом приложении', () => {
    render(<IosInstallHint />);

    const steps = screen.getAllByRole('listitem');
    expect(steps[0]).toHaveTextContent('Если ссылка открыта внутри Telegram, WhatsApp или другого приложения');
    expect(steps[0]).toHaveTextContent('Открыть в Safari');
    expect(steps[2]).toHaveTextContent('На экран „Домой“');
  });

  it('копирует ссылку', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<IosInstallHint />);

    fireEvent.click(screen.getByRole('button', { name: 'Скопировать ссылку' }));

    expect(await screen.findByText(/Ссылка скопирована/)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('если копирование не удалось — показывает ссылку текстом', async () => {
    render(<IosInstallHint />);

    fireEvent.click(screen.getByRole('button', { name: 'Скопировать ссылку' }));

    expect(await screen.findByText(/Скопируйте ссылку вручную/)).toBeInTheDocument();
    expect(screen.getByText(window.location.href)).toBeInTheDocument();
  });
});
