import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RouteError } from './RouteError';

function Boom(): never {
  throw new Error('Сломалось');
}

describe('RouteError', () => {
  it('показывает экран ошибки с текстом и кнопкой обновления', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <RouteError /> }]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Что-то пошло не так' })).toBeInTheDocument();
    expect(screen.getByText('Сломалось')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Обновить страницу' })).toBeInTheDocument();
  });
});
