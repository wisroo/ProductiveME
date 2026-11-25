import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
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
  const props = { onDomainSelect: vi.fn(), onOpenDomains: vi.fn(), onOpenRegistry: vi.fn(), onStartReview: vi.fn() };
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
      getSnapshots: vi.fn().mockResolvedValue([
        { status: 'ok', items: [{ title: 'Recent work', timestamp: '2026-10-25T08:00:00.000Z' }, { title: 'Undated work' }] },
        { status: 'error', items: [{ title: 'Failed activity', timestamp: '2026-10-26T08:00:00.000Z' }] },
      ]),
      getDomains: vi.fn().mockResolvedValue(rollups),
      getSignals: vi.fn().mockResolvedValue([signal]),
    } as unknown as ApiClient;
    const { onDomainSelect, user } = renderHome(api);

    expect(await screen.findByText('Source sync · 1/2 (50%)')).toBeInTheDocument();
    const actions = within(screen.getByRole('region', { name: 'Next actions' }));
    expect(actions.getByText('1 · Create a snapshot')).toBeInTheDocument();
    expect(await screen.findByText('Recent work')).toBeInTheDocument();
    expect(screen.queryByText('Undated work')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed activity')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Life' })).toHaveTextContent('UNAVAILABLE');
    await user.click(screen.getByRole('button', { name: 'Personal Data' }));
    expect(onDomainSelect).toHaveBeenCalledWith('pdata');
    expect(screen.queryByText('This week, close the July finance snapshot')).not.toBeInTheDocument();
  });

  it('shows loading independently and renders empty results', async () => {
    let finishDomains!: (value: typeof rollups) => void;
    const api = {
      getSnapshots: vi.fn().mockResolvedValue([]),
      getDomains: vi.fn(() => new Promise<typeof rollups>((resolve) => { finishDomains = resolve; })),
      getSignals: vi.fn().mockResolvedValue([]),
    } as unknown as ApiClient;
    renderHome(api);

    expect(screen.getByText('Loading domain progress…')).toBeInTheDocument();
    expect(await screen.findByText('No next actions yet.')).toBeInTheDocument();
    expect(await screen.findByText('No recent activity yet.')).toBeInTheDocument();
    expect(await screen.findByText('No current signals.')).toBeInTheDocument();
    finishDomains(rollups);
    expect(await screen.findByText('Source sync · 1/2 (50%)')).toBeInTheDocument();
  });

  it('keeps rollups visible when signals fail and retries only signals', async () => {
    const api = {
      getSnapshots: vi.fn().mockResolvedValue([]),
      getDomains: vi.fn().mockResolvedValue(rollups),
      getSignals: vi.fn().mockRejectedValueOnce(new Error('Signals offline')).mockResolvedValue([signal]),
    } as unknown as ApiClient;
    const { user } = renderHome(api);

    expect(await screen.findByText('Source sync · 1/2 (50%)')).toBeInTheDocument();
    const actions = within(screen.getByRole('region', { name: 'Next actions' }));
    expect(await actions.findByText('Signals offline')).toBeInTheDocument();
    await user.click(actions.getByRole('button', { name: 'Retry next actions' }));
    expect(await actions.findByText('1 · Create a snapshot')).toBeInTheDocument();
    expect(api.getDomains).toHaveBeenCalledTimes(1);
    expect(api.getSignals).toHaveBeenCalledTimes(2);
  });
});
