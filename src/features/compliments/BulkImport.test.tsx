import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BulkImport } from './BulkImport';

describe('BulkImport', () => {
  it('показывает, сколько будет добавлено, и отправляет список', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BulkImport pending={false} onSubmit={onSubmit} onClose={vi.fn()} />);

    expect(screen.getByLabelText('Заголовок для всех')).toHaveValue('Комплимент для тебя 💌');
    await user.type(screen.getByLabelText('Тексты, по одному на строку'), 'Первый{enter}{enter}Второй');
    expect(screen.getByText('Будет добавлено: 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(onSubmit).toHaveBeenCalledWith([
      { title: 'Комплимент для тебя 💌', text: 'Первый' },
      { title: 'Комплимент для тебя 💌', text: 'Второй' },
    ]);
  });

  it('ошибка показывается только после попытки отправить', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BulkImport pending={false} onSubmit={onSubmit} onClose={vi.fn()} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Добавьте хотя бы одну строку');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
