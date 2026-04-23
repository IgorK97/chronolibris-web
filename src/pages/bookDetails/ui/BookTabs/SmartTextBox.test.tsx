import { render, screen, fireEvent } from '@testing-library/react';
import { SmartTextBox } from './SmartTextBox';
import { vi, describe, it, expect } from 'vitest';

vi.mock('lucide-react', () => ({
  CornerDownRight: () => <div data-testid="icon-reply" />,
  X: () => <div data-testid="icon-x" />,
}));

vi.mock('@/components/dialogs/AlertDialog', () => ({
  AlertDialog: () => <div data-testid="alert-dialog" />,
}));

describe('SmartTextBox Formatting', () => {
  const defaultProps = {
    placeholder: 'Введите текст',
    type: 'comment' as const,
    onSubmit: vi.fn(),
  };

  it('должен вставлять символы форматирования в пустой textarea при клике на кнопки', () => {
    render(<SmartTextBox {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(
      'Введите текст'
    ) as HTMLTextAreaElement;
    const boldBtn = screen.getByTitle('Жирный');
    const spoilerBtn = screen.getByTitle('Скрыть');

    fireEvent.click(boldBtn);
    expect(textarea.value).toBe('****');

    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(spoilerBtn);
    expect(textarea.value).toBe('>!!<');
  });

  it('должен оборачивать выделенный текст в символы форматирования', () => {
    const initialText = 'Мама мыла раму';
    render(<SmartTextBox {...defaultProps} initialText={initialText} />);

    const textarea = screen.getByDisplayValue(
      initialText
    ) as HTMLTextAreaElement;
    const italicBtn = screen.getByTitle('Курсив');

    textarea.setSelectionRange(5, 9);

    fireEvent.click(italicBtn);

    expect(textarea.value).toBe('Мама _мыла_ раму');
  });
});
