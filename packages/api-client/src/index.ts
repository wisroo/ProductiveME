import type { paths } from './openapi.js';

type Registry = paths['/registry']['get']['responses'][200]['content']['application/json'];
type Snapshots = paths['/snapshots']['get']['responses'][200]['content']['application/json'];
type Signals = paths['/signals']['get']['responses'][200]['content']['application/json'];
type Domains = paths['/domains']['get']['responses'][200]['content']['application/json'];
type SnapshotQuery = NonNullable<paths['/snapshots']['get']['parameters']['query']>;

export interface ApiClient {
  getRegistry(): Promise<Registry>;
  getSnapshots(options?: SnapshotQuery): Promise<Snapshots>;
  getSignals(): Promise<Signals>;
  getDomains(): Promise<Domains>;
}

export function createApiClient(baseUrl: string, fetcher: typeof fetch = fetch): ApiClient {
  async function get<T>(path: string): Promise<T> {
    const response = await fetcher(new URL(path, baseUrl));
    if (!response.ok) throw new Error(`ProductiveME API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }

  return {
    getRegistry: () => get<Registry>('/registry'),
    getSnapshots: ({ domain } = {}) => get<Snapshots>(`/snapshots${domain ? `?domain=${encodeURIComponent(domain)}` : ''}`),
    getSignals: () => get<Signals>('/signals'),
    getDomains: () => get<Domains>('/domains'),
  };
}
