import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookmarkPanel } from './BookmarkPanel';
import '@testing-library/jest-dom/vitest';

vi.mock('@/utils', () => ({
  formatDate: (date: string) => `${date}`,
}));

describe('BookmarkPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const mockBookmarks = [
    {
      id: 101,
      xpointer: '5',
      context: '',
      note: 'Заметка',
      createdAt: '2024-05-01',
      bookFileId: 1,
    },
    {
      id: 102,
      xpointer: '20',
      note: '',
      context: '',
      createdAt: '2024-05-02',
      bookFileId: 1,
    },
  ];
  const defaultProps = {
    open: true,
    bookmarks: mockBookmarks,
    onClose: vi.fn(),
    onNavigate: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
  };

  it('отображение списка закладок с датами', () => {
    render(<BookmarkPanel {...defaultProps} />);

    expect(screen.getByText('Заметка')).toBeInTheDocument();
    expect(screen.getByText('2024-05-01')).toBeInTheDocument();
    expect(screen.getByText('2024-05-02')).toBeInTheDocument();
  });

  it('вызов onNavigate при клике по закладке', () => {
    render(<BookmarkPanel {...defaultProps} />);

    // const bookmarkItem = screen.getByText('Important quote');
    const paragraphTitle = screen.getByText('Абзац №5');
    fireEvent.click(paragraphTitle);
    // fireEvent.click(bookmarkItem);

    expect(defaultProps.onNavigate).toHaveBeenCalledWith(mockBookmarks[0]);
  });
  it('удаление закладки при клике на кнопку Удалить', () => {
    render(<BookmarkPanel {...defaultProps} />);

    const deleteButtons = screen.getAllByText('Удалить');
    fireEvent.click(deleteButtons[0]);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(101);
    expect(defaultProps.onNavigate).not.toHaveBeenCalled();
  });
  it('скрытие панели при нажатии на кнопку Скрыть', () => {
    render(<BookmarkPanel {...defaultProps} />);

    const overlay = screen.getByTestId('panel-overlay');

    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
