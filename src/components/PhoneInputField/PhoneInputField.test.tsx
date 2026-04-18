/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PhoneInputField } from './PhoneInputField';
import '@testing-library/jest-dom/vitest';
describe('PhoneInputField', () => {
  const defaultProps = {
    label: 'Phone Number',
    value: '',
    onChange: vi.fn(),
  };
  it('renders the label and input field correctly', () => {
    render(<PhoneInputField {...defaultProps} />);
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone Number')).toBeInTheDocument();
  });

  it('displays the formatted mask by default', () => {
    render(<PhoneInputField {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'Phone Number'
    ) as HTMLInputElement;
    // Since allowEmptyFormatting is true, it should show the mask
    expect(input.value).toBe('+7 ___ ___ __ __');
  });
  it('calls onChange with the unformatted value when the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<PhoneInputField {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Phone Number');

    // Type a single digit
    await user.type(input, '9');

    // react-number-format onValueChange returns the raw string value to our onChange
    expect(onChange).toHaveBeenCalledWith('9');
  });
  it('displays an error message and applies the error class when provided', () => {
    const errorMessage = 'Invalid phone number';
    const { container } = render(
      <PhoneInputField {...defaultProps} error={errorMessage} />
    );

    // Check if error text is rendered
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Check for error class application
    // Note: Since you use CSS modules, we check if the class list contains the expected key
    const input = screen.getByPlaceholderText('Phone Number');
    expect(input.className).toContain('error-input');
  });
  it('updates the displayed value when the value prop changes', () => {
    const { rerender } = render(
      <PhoneInputField {...defaultProps} value="900" />
    );
    const input = screen.getByPlaceholderText(
      'Phone Number'
    ) as HTMLInputElement;
    expect(input.value).toBe('+7 900 ___ __ __');
    rerender(<PhoneInputField {...defaultProps} value="900123" />);
    expect(input.value).toBe('+7 900 123 __ __');
  });
});
