/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookCard } from './index';
import { useStore } from '@/stores/globalStore';
import '@testing-library/jest-dom/vitest';

// 1. Mock the global store
vi.mock('@/stores/globalStore', () => ({
  useStore: vi.fn(),
}));
// 2. Mock environment variables
// In Vitest, you can use vi.stubEnv
vi.stubEnv('VITE_STORAGE_URL', 'http://test-storage.com');
describe('BookCard', () => {
  const mockBook = {
    id: 1,
    title: 'Книга',
    authors: ['Автор'],
    coverUri: 'covers/book.jpg',
    isFavorite: false,
    averageRating: 0,
    ratingsCount: 0,
    isReviewable: true,
  };
  const defaultProps = {
    bookInfo: mockBook,
    onPress: vi.fn(),
    onFavoriteToggle: vi.fn(),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: user is a reader
    (useStore as any).mockReturnValue({ user: { role: 'reader' } });
  });

  it('отображение заголока книги и списка авторов', () => {
    render(<BookCard {...defaultProps} />);

    expect(screen.getByText('Книга')).toBeInTheDocument();
    expect(screen.getByText('Автор')).toBeInTheDocument();
  });
  it('отображение картинки', () => {
    render(<BookCard {...defaultProps} />);

    const img = screen.getByAltText('Книга') as HTMLImageElement;
    expect(img.src).toBe('http://test-storage.com/covers/book.jpg');
  });

  it('отображение заполнителя (placeholder) при отсутствии картинки', () => {
    const bookWithoutCover = {
      ...mockBook,
      coverUri: null,
      averageRating: 0,
      ratingsCount: 0,
      isReviewable: true,
    };
    render(<BookCard {...defaultProps} bookInfo={bookWithoutCover} />);

    // Check for the title inside the placeholder div
    const placeholder = screen.getAllByText('Книга');
    expect(placeholder).toHaveLength(2);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  //   it('клик по картинке', () => {
  //     render(<BookCard {...defaultProps} />);

  //     // The wrapper has the onClick, but clicking the image bubbles up
  //     const imageWrapper = screen.getByAltText('Книга').parentElement!;
  //     fireEvent.click(imageWrapper);

  //     expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  //   });
  describe('Логика избранного', () => {
    it('отображение иконки для читателей', () => {
      render(<BookCard {...defaultProps} />);
      expect(screen.getByLabelText('Toggle favorite')).toBeInTheDocument();
    });

    it('скрытие иконки для админов', () => {
      (useStore as any).mockReturnValue({ user: { role: 'admin' } });
      render(<BookCard {...defaultProps} />);

      expect(
        screen.queryByLabelText('Toggle favorite')
      ).not.toBeInTheDocument();
    });

    it('корректный клик по иконке избранного', () => {
      render(<BookCard {...defaultProps} />);

      const favButton = screen.getByLabelText('Toggle favorite');
      fireEvent.click(favButton);

      // Check callback
      expect(defaultProps.onFavoriteToggle).toHaveBeenCalledWith(
        mockBook.id,
        mockBook.isFavorite
      );
      expect(defaultProps.onPress).not.toHaveBeenCalled();
    });
  });

  it('перечисление авторов', () => {
    const multiAuthorBook = {
      ...mockBook,
      authors: ['Первый автор', 'Второй автор'],
      coverUri: null,
      averageRating: 0,
      ratingsCount: 0,
      isReviewable: true,
    };
    render(<BookCard {...defaultProps} bookInfo={multiAuthorBook} />);

    expect(screen.getByText('Первый автор, Второй автор')).toBeInTheDocument();
  });
});
