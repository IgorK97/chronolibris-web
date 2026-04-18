/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    // Since allowEmptyFormatting is true, it should show the mask
    expect(input.value).toBe('+7 ___ ___ __ __');
  });

  it('отображение сообщения об ошибке', () => {
    const errorMessage = 'Ошибка';
    const { container } = render(
      <PhoneInputField {...defaultProps} error={errorMessage} />
    );

    // Check if error text is rendered
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Check for error class application
    // Note: Since you use CSS modules, we check if the class list contains the expected key
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
