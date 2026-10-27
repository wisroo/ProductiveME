import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReviewApiError, type ApiClient } from '@productiveme/api-client';
import { ApiContext } from '../lib/api.js';
import type { ReviewMode } from '../types.js';
import Review from './Review.js';

const renderReview = (mode: ReviewMode, apiOverrides: Partial<ApiClient> = {}) => {
  const onModeChange = vi.fn();
  const api = {
    createReview: vi.fn(async (period: ReviewMode) => ({
      period,
      rangeStart: '2026-10-19T12:00:00.000Z',
      rangeEnd: '2026-10-26T12:00:00.000Z',
      draft: 'Progress made\nNext steps',
    })),
    ...apiOverrides,
  } as unknown as ApiClient;
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>
        <Review mode={mode} onModeChange={onModeChange} />
      </ApiContext.Provider>
    </QueryClientProvider>,
  );
  return { onModeChange, user: userEvent.setup() };
};

describe('Review', () => {
  it('opens on a weekly review with no prototype narrative presented as real data', () => {
    renderReview('weekly');

    expect(screen.getByRole('heading', { name: 'Weekly review' })).toBeInTheDocument();
    expect(screen.queryByText('3 done · connector broke · cert stalled')).not.toBeInTheDocument();
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

  it('shows a monthly generation view without prototype calendar or rollup data', () => {
    renderReview('monthly');

    expect(screen.getByRole('heading', { name: 'Monthly review' })).toBeInTheDocument();
    expect(screen.queryByText('18 done · best streak 5d · 3 blockers cleared')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/activity/)).not.toBeInTheDocument();
  });

  it('generates and displays the server draft as plain text with its actual range', async () => {
    const { user } = renderReview('weekly');

    await user.click(screen.getByRole('button', { name: 'Generate review' }));

    expect(await screen.findByText(/Progress made/)).toHaveStyle({ whiteSpace: 'pre-wrap' });
    expect(screen.getByText('Oct 19, 2026 – Oct 26, 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate review' })).toBeInTheDocument();
  });

  it('renders model output containing HTML as text instead of creating elements', async () => {
    const createReview = vi.fn(async () => ({
      period: 'weekly' as const,
      rangeStart: '2026-10-19T12:00:00.000Z',
      rangeEnd: '2026-10-26T12:00:00.000Z',
      draft: '<img src=x onerror=alert(1)>',
    }));
    const { user } = renderReview('weekly', { createReview } as never);

    await user.click(screen.getByRole('button', { name: 'Generate review' }));

    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  it('disables period changes and generation while a request is pending', async () => {
    let resolveDraft!: (value: { period: ReviewMode; rangeStart: string; rangeEnd: string; draft: string }) => void;
    const createReview = vi.fn(() => new Promise((resolve) => { resolveDraft = resolve; }));
    const { user, onModeChange } = renderReview('weekly', { createReview } as never);

    await user.click(screen.getByRole('button', { name: 'Generate review' }));
    expect(screen.getByRole('button', { name: 'Generating review' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'MONTHLY' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Generating review' }));
    expect(createReview).toHaveBeenCalledTimes(1);
    expect(onModeChange).not.toHaveBeenCalled();

    resolveDraft({ period: 'weekly', rangeStart: '2026-10-19T12:00:00.000Z', rangeEnd: '2026-10-26T12:00:00.000Z', draft: 'done' });
    await waitFor(() => expect(screen.getByText('done')).toBeInTheDocument());
  });

  it('shows safe recovery guidance and keeps the last draft after a failed regenerate', async () => {
    const createReview = vi.fn()
      .mockResolvedValueOnce({ period: 'weekly', rangeStart: '2026-10-19T12:00:00.000Z', rangeEnd: '2026-10-26T12:00:00.000Z', draft: 'Earlier draft' })
      .mockRejectedValueOnce(new ReviewApiError('inference_disabled'));
    const { user } = renderReview('weekly', { createReview } as never);

    await user.click(screen.getByRole('button', { name: 'Generate review' }));
    expect(await screen.findByText('Earlier draft')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Regenerate review' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/not enabled/i);
    expect(screen.getByText('Earlier draft')).toBeInTheDocument();
    expect(screen.queryByText('Review generation request failed')).not.toBeInTheDocument();
  });
});
