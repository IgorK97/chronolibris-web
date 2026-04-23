/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from './StarRating';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/utils', () => ({
  pluralize: (_: number) => 'ratings',
}));

describe('StarRating Component', () => {
  const defaultProps = {
    averageRating: 4.5,
    ratingsCount: 10,
    userRating: 0,
    isReader: true,
    hasReview: false,
    onRate: vi.fn(),
    onDeleteClick: vi.fn(),
  };

  it('должен показывать всплывающее окно при наведении, если пользователь — читатель', async () => {
    render(<StarRating {...defaultProps} />);

    const trigger = screen.getByTestId('rating-trigger');
    fireEvent.mouseEnter(trigger);

    expect(screen.getByTestId('rating-popup')).toBeInTheDocument();
    expect(screen.getByText('book.rate_book')).toBeInTheDocument();
  });

  it('не должен показывать всплывающее окно при наведении, если пользователь — админ (не читатель)', () => {
    render(<StarRating {...defaultProps} isReader={false} />);

    const trigger = screen.getByTestId('rating-trigger');
    fireEvent.mouseEnter(trigger);

    expect(screen.queryByTestId('rating-popup')).not.toBeInTheDocument();
  });

  it('должен вызывать onRate с правильным значением при клике на звезду', async () => {
    render(<StarRating {...defaultProps} />);

    fireEvent.mouseEnter(screen.getByTestId('rating-trigger'));

    const star4 = screen.getByTestId('star-4');
    fireEvent.click(star4);

    expect(defaultProps.onRate).toHaveBeenCalledWith(4);
  });
});
