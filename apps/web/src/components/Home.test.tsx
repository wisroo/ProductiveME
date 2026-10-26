import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '@productiveme/api-client';
import Home from './Home.js';
import { ApiContext } from '../lib/api.js';

const rollups = [
  { domain: 'career', health: 'healthy', entryCount: 1, okCount: 1, errorCount: 0, itemCount: 2, latestActivityAt: '2026-10-25T08:00:00.000Z' },
  { domain: 'finance', health: 'unavailable', entryCount: 0, okCount: 0, errorCount: 0, itemCount: 0, latestActivityAt: null },
  { domain: 'personal-data', health: 'degraded', entryCount: 2, okCount: 1, errorCount: 1, itemCount: 3, latestActivityAt: null },
  { domain: 'life', health: 'unavailable', entryCount: 1, okCount: 0, errorCount: 1, itemCount: 0, latestActivityAt: null },
] as const;

const signal = { severity: 'due', domain: 'finance', message: 'Snapshot overdue', suggestedAction: 'Create a snapshot' } as const;

function renderHome(api: ApiClient) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const props = { onDomainSelect: vi.fn(), onOpenDomains: vi.fn(), onStartReview: vi.fn() };
  render(
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}><Home {...props} /></ApiContext.Provider>
    </QueryClientProvider>,
  );
  return { ...props, user: userEvent.setup(), queryClient };
}

describe('Home live API sections', () => {
  it('maps personal-data rollups and renders signal results', async () => {
    const api = {
      getDomains: vi.fn().mockResolvedValue(rollups),
      getSignals: vi.fn().mockResolvedValue([signal]),
    } as unknown as ApiClient;
    const { onDomainSelect, user } = renderHome(api);

    expect(await screen.findByText(/1\/2 sources · 3 items/)).toBeInTheDocument();
    expect(screen.getByText('Snapshot overdue')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Personal Data' }));
    expect(onDomainSelect).toHaveBeenCalledWith('pdata');
    expect(screen.queryByText('This week, close the July finance snapshot')).not.toBeInTheDocument();
  });

  it('shows loading independently and renders empty results', async () => {
    let finishDomains!: (value: typeof rollups) => void;
    const api = {
      getDomains: vi.fn(() => new Promise<typeof rollups>((resolve) => { finishDomains = resolve; })),
      getSignals: vi.fn().mockResolvedValue([]),
    } as unknown as ApiClient;
    renderHome(api);

    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(await screen.findByText('No signals yet.')).toBeInTheDocument();
    finishDomains(rollups);
    expect(await screen.findByText(/1\/2 sources · 3 items/)).toBeInTheDocument();
  });

  it('keeps rollups visible when signals fail and retries only signals', async () => {
    const api = {
      getDomains: vi.fn().mockResolvedValue(rollups),
      getSignals: vi.fn().mockRejectedValueOnce(new Error('Signals offline')).mockResolvedValue([signal]),
    } as unknown as ApiClient;
    const { user } = renderHome(api);

    expect(await screen.findByText(/1\/2 sources · 3 items/)).toBeInTheDocument();
    expect(await screen.findByText('Signals offline')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry signals' }));
    expect(await screen.findByText('Snapshot overdue')).toBeInTheDocument();
    expect(api.getDomains).toHaveBeenCalledTimes(1);
    expect(api.getSignals).toHaveBeenCalledTimes(2);
  });
});
