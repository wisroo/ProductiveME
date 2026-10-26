import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReviewMode } from '../types.js';
import Review from './Review.js';

const renderReview = (mode: ReviewMode) => {
  const onModeChange = vi.fn();
  render(<Review mode={mode} onModeChange={onModeChange} />);
  return { onModeChange, user: userEvent.setup() };
};

describe('Review', () => {
  it('opens on the weekly narrative and its domain rollup', () => {
    renderReview('weekly');

    expect(
      screen.getByRole('heading', { name: 'Weekly review · Week 29' }),
    ).toBeInTheDocument();
    expect(screen.getByText('✍ THIS WEEK, IN A SENTENCE')).toBeInTheDocument();
    expect(
      screen.getByText('3 done · connector broke · cert stalled'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Protect Saturday for exercise/),
    ).toBeInTheDocument();
  });

  it('marks the active mode and reports a switch to monthly', async () => {
    const { user, onModeChange } = renderReview('weekly');

    const weekly = screen.getByRole('button', { name: 'WEEKLY' });
    const monthly = screen.getByRole('button', { name: 'MONTHLY' });
    expect(weekly).toHaveAttribute('aria-pressed', 'true');
    expect(monthly).toHaveAttribute('aria-pressed', 'false');

    await user.click(monthly);
    expect(onModeChange).toHaveBeenCalledWith('monthly');
  });

  it('shows the monthly narrative, heatmap and month rollup', () => {
    renderReview('monthly');

    expect(
      screen.getByRole('heading', { name: 'Monthly review · July 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByText('✍ THIS MONTH, IN A SENTENCE')).toBeInTheDocument();
    expect(screen.getByText('July 2026')).toBeInTheDocument();
    expect(
      screen.getByText('18 done · best streak 5d · 3 blockers cleared'),
    ).toBeInTheDocument();
  });

  it('renders every day of July in the heatmap', () => {
    renderReview('monthly');

    const grid = screen.getByLabelText('July 2026 activity');
    expect(grid.querySelectorAll('[data-day]')).toHaveLength(31);
    expect(grid.querySelector('[data-day="17"]')).toHaveAttribute(
      'data-today',
      'true',
    );
    expect(grid.querySelector('[data-day="20"]')).toHaveAttribute(
      'data-future',
      'true',
    );
  });

  it('keeps the weekly and monthly views mutually exclusive', () => {
    renderReview('monthly');

    expect(screen.queryByText('✍ THIS WEEK, IN A SENTENCE')).not.toBeInTheDocument();
    expect(
      screen.queryByText('3 done · connector broke · cert stalled'),
    ).not.toBeInTheDocument();
  });
});
