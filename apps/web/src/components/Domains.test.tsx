import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '@productiveme/api-client';
import type { DomainId } from '../types.js';
import { ApiContext } from '../lib/api.js';
import Domains from './Domains.js';

const renderDomains = (activeDomain: DomainId, overrides: Partial<ApiClient> = {}) => {
  const onDomainChange = vi.fn();
  const api = {
    getRegistry: vi.fn().mockResolvedValue([]),
    getSourceHealth: vi.fn().mockResolvedValue([]),
    getSnapshots: vi.fn().mockResolvedValue([]),
    getSignals: vi.fn().mockResolvedValue([]),
    getDomains: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as ApiClient;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={queryClient}><ApiContext.Provider value={api}><Domains activeDomain={activeDomain} onDomainChange={onDomainChange} /></ApiContext.Provider></QueryClientProvider>);
  const renderDomain = (domain: DomainId) => view.rerender(<QueryClientProvider client={queryClient}><ApiContext.Provider value={api}><Domains activeDomain={domain} onDomainChange={onDomainChange} /></ApiContext.Provider></QueryClientProvider>);
  return { onDomainChange, user: userEvent.setup(), renderDomain };
};

describe('Domains', () => {
  it('marks the active domain in the sub navigation and reports changes', async () => {
    const { user, onDomainChange } = renderDomains('finance');

    const nav = screen.getByRole('navigation', { name: 'Domains' });
    expect(nav).toBeInTheDocument();

    const finance = screen.getByRole('button', { name: 'Finance' });
    const life = screen.getByRole('button', { name: 'Life' });
    expect(finance).toHaveAttribute('aria-pressed', 'true');
    expect(life).toHaveAttribute('aria-pressed', 'false');

    await user.click(life);
    expect(onDomainChange).toHaveBeenCalledWith('life');
  });

  it('shows only the active domain panel', () => {
    renderDomains('finance');

    expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Career' })).not.toBeInTheDocument();
  });

  it('uses collected writing data instead of prototype metrics', async () => {
    renderDomains('career', {
      getRegistry: vi.fn().mockResolvedValue([{ id: 'study', name: 'Architecture notes', domain: 'career', subdomain: 'study', connector: 'notion', kind: 'notion-page', locator: 'unused' }]),
      getSnapshots: vi.fn().mockResolvedValue([{ entryId: 'study', status: 'ok', fetchedAt: '2026-11-23T11:00:00Z', items: [{ title: 'Queue tradeoffs' }] }]),
    });
    expect(screen.getByRole('region', { name: 'Study · writing by field' })).toBeInTheDocument();
    expect(await screen.findByText('1 collected entry')).toBeInTheDocument();
    expect(screen.queryByText('18 pg')).not.toBeInTheDocument();
  });

  it('derives Personal Data folders from live registry entries', async () => {
    renderDomains('pdata', {
      getRegistry: vi.fn().mockResolvedValue([{ id: 'photos', name: 'Photo archive', domain: 'personal-data', connector: 'local-folder', kind: 'folder', locator: 'unused' }]),
      getSnapshots: vi.fn().mockResolvedValue([{ entryId: 'photos', status: 'ok', fetchedAt: '2026-11-23T11:00:00Z', items: [{ title: 'Weekend photos' }] }]),
    });
    expect(await screen.findByText('Photo archive · 1 entry')).toBeInTheDocument();
    expect(screen.queryByText('62% organized · 5 need attention')).not.toBeInTheDocument();
  });

  it('loads the selected domain entries and snapshots using the API domain ID', async () => {
    const entry = { id: 'finance-assets', name: 'Asset Ledger', kind: 'folder', domain: 'finance', locator: '/data/assets', connector: 'local-folder' } as const;
    renderDomains('finance', {
      getRegistry: vi.fn().mockResolvedValue([entry]),
      getSnapshots: vi.fn().mockResolvedValue([{ entryId: 'finance-assets', fetchedAt: '2026-10-26T08:00:00.000Z', status: 'ok', items: [{ title: 'October balance', detail: 'Updated today' }] }]),
      getSignals: vi.fn().mockResolvedValue([{ severity: 'due', domain: 'finance', message: 'Balance review due', suggestedAction: 'Review the balance' }]),
    });

    expect(await screen.findAllByText('Asset Ledger')).toHaveLength(2);
    expect(await screen.findByText('October balance · Updated today')).toBeInTheDocument();
    expect(await screen.findByText('Balance review due')).toBeInTheDocument();
  });

  it('keeps snapshots visible when registry fails and retries registry independently', async () => {
    const getRegistry = vi.fn().mockRejectedValueOnce(new Error('Registry unavailable')).mockResolvedValue([]);
    renderDomains('pdata', {
      getRegistry,
      getSnapshots: vi.fn().mockResolvedValue([{ entryId: 'photo-library', fetchedAt: '2026-10-26T08:00:00.000Z', status: 'ok', items: [{ title: 'Photo index' }] }]),
    });

    expect(await screen.findByText('Registry unavailable')).toBeInTheDocument();
    expect(await screen.findByText('Photo index')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry registry sources' }));
    expect(await screen.findByText('No registry sources yet.')).toBeInTheDocument();
    expect(getRegistry).toHaveBeenCalledTimes(2);
  });

  it('uses a distinct snapshot query when the selected domain changes', async () => {
    const getSnapshots = vi.fn().mockResolvedValue([]);
    const getSignals = vi.fn().mockResolvedValue([]);
    const { user, renderDomain } = renderDomains('finance', { getSnapshots, getSignals });

    await user.click(screen.getByRole('button', { name: 'Life' }));
    renderDomain('life');
    expect(await screen.findByText('No latest snapshots yet.')).toBeInTheDocument();
    expect(getSnapshots).toHaveBeenNthCalledWith(1, { domain: 'finance' });
    expect(getSnapshots).toHaveBeenNthCalledWith(2, { domain: 'life' });
    expect(getSignals).toHaveBeenCalledTimes(2);
  });

  it('does not show the previous domain snapshots while the next domain loads', async () => {
    type SnapshotFixture = { entryId: string; fetchedAt: string; status: 'ok'; items: { title: string }[] };
    let finishLifeSnapshots!: (snapshots: SnapshotFixture[]) => void;
    const getSnapshots = vi.fn()
      .mockResolvedValueOnce([{ entryId: 'finance-entry', fetchedAt: '2026-10-26T08:00:00.000Z', status: 'ok', items: [{ title: 'Finance only' }] }])
      .mockImplementationOnce(() => new Promise<SnapshotFixture[]>((resolve) => { finishLifeSnapshots = resolve; }));
    const { user, renderDomain } = renderDomains('finance', { getSnapshots });

    expect(await screen.findByText('Finance only')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Life' }));
    renderDomain('life');

    expect(await screen.findByText('Loading latest snapshots…')).toBeInTheDocument();
    expect(screen.queryByText('Finance only')).not.toBeInTheDocument();
    finishLifeSnapshots([{ entryId: 'life-entry', fetchedAt: '2026-10-26T08:00:00.000Z', status: 'ok', items: [{ title: 'Life only' }] }]);
    expect(await screen.findByText('Life only')).toBeInTheDocument();
  });
});
