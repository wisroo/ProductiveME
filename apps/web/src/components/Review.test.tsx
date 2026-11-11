import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>
        <Review mode={mode} onModeChange={onModeChange} />
      </ApiContext.Provider>
    </QueryClientProvider>,
  );
  return { ...view, onModeChange, user: userEvent.setup() };
};

describe('Review', () => {
  afterEach(() => {
    localStorage.removeItem('productiveme:review:weekly');
    localStorage.removeItem('productiveme:review-history:weekly');
  });

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

  it('edits a generated review and restores the saved text after remounting', async () => {
    const { user, unmount } = renderReview('weekly');
    await user.click(screen.getByRole('button', { name: 'Generate review' }));
    await user.click(await screen.findByRole('button', { name: 'Edit review' }));
    const editor = screen.getByRole('textbox', { name: 'Review text' });
    await user.clear(editor);
    await user.type(editor, 'Edited review');
    await user.click(screen.getByRole('button', { name: 'Save review' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved in this browser');
    unmount();

    const monthly = renderReview('monthly');
    expect(screen.queryByText('Edited review')).not.toBeInTheDocument();
    monthly.unmount();
    renderReview('weekly');
    expect(screen.getByText('Edited review')).toBeInTheDocument();
  });

  it('keeps finalized text in history after regeneration and reopening', async () => {
    const { user, unmount } = renderReview('weekly');
    await user.click(screen.getByRole('button', { name: 'Generate review' }));
    await user.click(await screen.findByRole('button', { name: 'Finalize review' }));
    expect(screen.getByRole('status')).toHaveTextContent('Review finalized');
    await user.click(screen.getByRole('button', { name: 'Edit review' }));
    await user.type(screen.getByRole('textbox', { name: 'Review text' }), ' changed');
    await user.click(screen.getByRole('button', { name: 'Save review' }));
    await user.click(screen.getByRole('button', { name: 'Regenerate review' }));
    await screen.findByRole('button', { name: 'Regenerate review' });
    unmount();
    renderReview('weekly');
    const history = screen.getByRole('region', { name: 'Review history' });
    expect(history).toHaveTextContent('Progress made');
    const createUrl = vi.fn(() => 'blob:review');
    const revokeUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revokeUrl;
    try {
      await userEvent.setup().click(screen.getByRole('button', { name: 'Export Markdown' }));
      expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click.mock.contexts[0]).toMatchObject({ download: 'productiveme-weekly-2026-10-26.md' });
      await waitFor(() => expect(revokeUrl).toHaveBeenCalledWith('blob:review'));
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      click.mockRestore();
    }
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
