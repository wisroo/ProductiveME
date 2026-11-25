import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { ApiClient } from '@productiveme/api-client';
import { ApiContext } from '../lib/api.js';
import Registry from './Registry.js';

it('keeps sources visible through a status error, retries status alone, and filters by domain', async () => {
  const fetchedAt = '2026-11-25T10:00:00Z';
  const getRegistry = vi.fn<ApiClient['getRegistry']>().mockResolvedValue([
    { id: 'portfolio', name: 'Portfolio', kind: 'repo', connector: 'github', locator: 'unused', domain: 'career' },
    { id: 'archive', name: 'Archive', kind: 'folder', connector: 'local-folder', locator: 'unused', domain: 'personal-data' },
  ]);
  const getSourceHealth = vi.fn<ApiClient['getSourceHealth']>()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue([
      { id: 'portfolio', status: 'down', lastAttemptAt: '2026-11-25T11:00:00Z', lastGoodReadAt: fetchedAt, canRetry: false },
      { id: 'archive', status: 'idle', lastAttemptAt: null, lastGoodReadAt: null, canRetry: false },
    ]);
  const api: ApiClient = {
    getRegistry,
    getSourceHealth,
    retrySource: vi.fn(),
    getFinanceSnapshots: vi.fn(),
    recordFinance: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getWeekPlan: vi.fn(),
    updateWeekPlan: vi.fn(),
    getLifeWeek: vi.fn(),
    saveSlotPlan: vi.fn(),
    saveSlotActual: vi.fn(),
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    restoreTask: vi.fn(),
    carryTask: vi.fn(),
    getSnapshots: vi.fn(),
    getDomains: vi.fn(),
    getSignals: vi.fn(),
    createReview: vi.fn(),
    getReviewDraft: vi.fn(),
    saveReviewDraft: vi.fn(),
    getReviewEntries: vi.fn(),
    archiveReview: vi.fn(),
  };

  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ApiContext.Provider value={api}><Registry /></ApiContext.Provider>
    </QueryClientProvider>,
  );

  expect(await screen.findByText('Portfolio')).toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load source sync status.');
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Retry status' }));
  expect(await screen.findByText(/No snapshot yet/)).toBeInTheDocument();
  expect(screen.getByText(/Last good read/)).toHaveTextContent('Unavailable');
  expect(getRegistry).toHaveBeenCalledTimes(1);
  expect(getSourceHealth).toHaveBeenCalledTimes(2);

  await user.click(screen.getByRole('button', { name: 'Personal Data 1' }));
  const list = screen.getByRole('list');
  expect(within(list).getByText('Archive')).toBeInTheDocument();
  expect(within(list).queryByText('Portfolio')).not.toBeInTheDocument();
});
