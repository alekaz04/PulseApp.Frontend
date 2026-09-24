import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('тестовое окружение', () => {
  it('рендерит React и понимает матчеры jest-dom', () => {
    render(<p>Pulse</p>);
    expect(screen.getByText('Pulse')).toBeInTheDocument();
  });

  it('работает на origin http://localhost:3000', () => {
    expect(window.location.origin).toBe('http://localhost:3000');
  });
});
