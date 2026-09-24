import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/renderRoute';

describe('SubscribePage', () => {
  it('открывается без AuthProvider и без входа', async () => {
    renderRoute('/s/3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b');

    // В jsdom нет Push API — страница честно говорит об этом, а не падает и не требует входа
    expect(await screen.findByRole('heading', { name: 'Этот браузер не поддерживает уведомления' })).toBeInTheDocument();
    expect(screen.queryByText(/Войти/)).not.toBeInTheDocument();
  });

  it('понимает адрес с завершающим слэшем', async () => {
    renderRoute('/s/CODE-1/');

    expect(await screen.findByRole('heading', { name: 'Этот браузер не поддерживает уведомления' })).toBeInTheDocument();
  });
});
