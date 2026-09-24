import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';
import { Field, TextInput } from './Field';
import { Modal } from './Modal';
import { ToastProvider } from './ToastProvider';
import { useToast } from './toastContext';

afterEach(() => {
  vi.useRealTimers();
});

describe('Modal', () => {
  it('доступен как диалог и закрывается по Esc, крестику и фону', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Новый комплимент" onClose={onClose}>
        <p>тело</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Новый комплимент' });
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    fireEvent.mouseDown(dialog.parentElement!);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('клик внутри окна не закрывает его', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Окно" onClose={onClose}>
        <p>тело</p>
      </Modal>,
    );

    fireEvent.mouseDown(screen.getByText('тело'));

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Field', () => {
  it('показывает счётчик и ошибку', () => {
    render(
      <Field label="Текст" htmlFor="t" count={501} max={500} error="Не больше 500 символов">
        <TextInput id="t" />
      </Field>,
    );

    expect(screen.getByLabelText('Текст')).toBeInTheDocument();
    expect(screen.getByText('501/500')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Не больше 500 символов');
  });
});

describe('ErrorState', () => {
  it('показывает сообщение, код запроса и повтор', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Ошибка сервера. Попробуйте позже" traceId="t-1" onRetry={onRetry} />);

    expect(screen.getByText('Ошибка сервера. Попробуйте позже')).toBeInTheDocument();
    expect(screen.getByText('Код: t-1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('Toast', () => {
  function Trigger() {
    const toast = useToast();
    return (
      <>
        <button onClick={() => toast.show('Сохранено', { type: 'success' })}>ok</button>
        <button onClick={() => toast.show('Не удалось', { type: 'error', traceId: 't-9' })}>fail</button>
      </>
    );
  }

  it('показывает тост и скрывает через 4 секунды', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('ok'));
    expect(screen.getByText('Сохранено')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText('Сохранено')).not.toBeInTheDocument();
  });

  it('тост ошибки показывает код запроса и закрывается крестиком', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('fail'));
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось');
    expect(screen.getByText('Код: t-9')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть уведомление' }));
    expect(screen.queryByText('Не удалось')).not.toBeInTheDocument();
  });

  it('useToast вне провайдера — понятная ошибка', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow('useToast нужно вызывать внутри ToastProvider');
  });
});
