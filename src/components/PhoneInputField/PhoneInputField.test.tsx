/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PhoneInputField } from './PhoneInputField';
import '@testing-library/jest-dom/vitest';
describe('PhoneInputField', () => {
  const defaultProps = {
    label: 'Номер телефона',
    value: '',
    onChange: vi.fn(),
  };

  it('отображение маски телефона', () => {
    render(<PhoneInputField {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Номер телефона'
    ) as HTMLInputElement;
    expect(input.value).toBe('+7 ___ ___ __ __');
  });

  it('отображение сообщения об ошибке', () => {
    const errorMessage = 'Ошибка';
    const { container } = render(
      <PhoneInputField {...defaultProps} error={errorMessage} />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Номер телефона');
    expect(input.className).toContain('error-input');
  });
  it('корректно обновляет значение поля при вводе', () => {
    const { rerender } = render(
      <PhoneInputField {...defaultProps} value="900" />
    );
    const input = screen.getByPlaceholderText(
      'Номер телефона'
    ) as HTMLInputElement;
    expect(input.value).toBe('+7 900 ___ __ __');
    rerender(<PhoneInputField {...defaultProps} value="900123" />);
    expect(input.value).toBe('+7 900 123 __ __');
  });
});
