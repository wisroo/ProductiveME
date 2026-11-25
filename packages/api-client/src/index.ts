import type { paths } from './openapi.js';

type SourceHealth = paths['/sources']['get']['responses'][200]['content']['application/json'];
type Registry = paths['/registry']['get']['responses'][200]['content']['application/json'];
type Snapshots = paths['/snapshots']['get']['responses'][200]['content']['application/json'];
type Signals = paths['/signals']['get']['responses'][200]['content']['application/json'];
type Domains = paths['/domains']['get']['responses'][200]['content']['application/json'];
type SnapshotQuery = NonNullable<paths['/snapshots']['get']['parameters']['query']>;
type ReviewRequest = paths['/reviews']['post']['requestBody']['content']['application/json'];
export type ReviewDraft = paths['/reviews']['post']['responses'][200]['content']['application/json'];

export type ReviewErrorCode =
  | 'inference_disabled'
  | 'generation_busy'
  | 'inference_timeout'
  | 'inference_unavailable'
  | 'inference_invalid_response'
  | 'inference_failed'
  | 'unknown';

export class ReviewApiError extends Error {
  constructor(readonly code: ReviewErrorCode) {
    super('Review generation request failed');
    this.name = 'ReviewApiError';
  }
}

export interface ApiClient {
  getRegistry(): Promise<Registry>;
  getSourceHealth(): Promise<SourceHealth>;
  retrySource(id: string): Promise<SourceHealth[number]>;
  getSnapshots(options?: SnapshotQuery): Promise<Snapshots>;
  getSignals(): Promise<Signals>;
  getDomains(): Promise<Domains>;
  createReview(period: ReviewRequest['period']): Promise<ReviewDraft>;
}

export function createApiClient(baseUrl: string, fetcher: typeof fetch = fetch): ApiClient {
  async function get<T>(path: string): Promise<T> {
    const response = await fetcher(new URL(`${baseUrl.replace(/\/$/, '')}${path}`));
    if (!response.ok) throw new Error(`ProductiveME API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }

  async function createReview(period: ReviewRequest['period']): Promise<ReviewDraft> {
    let response: Response;
    try {
      response = await fetcher(new URL(`${baseUrl.replace(/\/$/, '')}/reviews`), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ period }),
      });
    } catch {
      throw new ReviewApiError('unknown');
    }

    if (!response.ok) {
      let code: ReviewErrorCode = 'unknown';
      try {
        const body = await response.json() as { code?: unknown };
        const knownCodes: ReviewErrorCode[] = [
          'inference_disabled', 'generation_busy', 'inference_timeout',
          'inference_unavailable', 'inference_invalid_response', 'inference_failed',
        ];
        if (typeof body.code === 'string' && knownCodes.includes(body.code as ReviewErrorCode)) {
          code = body.code as ReviewErrorCode;
        }
      } catch {
        // Keep the generic error when the server body is not JSON.
      }
      throw new ReviewApiError(code);
    }

    try {
      const body = await response.json() as Partial<ReviewDraft>;
      if (
        body.period !== period || typeof body.rangeStart !== 'string' ||
        typeof body.rangeEnd !== 'string' || typeof body.draft !== 'string' ||
        !Number.isFinite(Date.parse(body.rangeStart)) ||
        !Number.isFinite(Date.parse(body.rangeEnd)) ||
        Date.parse(body.rangeEnd) < Date.parse(body.rangeStart)
      ) throw new ReviewApiError('inference_invalid_response');
      return body as ReviewDraft;
    } catch (error) {
      if (error instanceof ReviewApiError) throw error;
      throw new ReviewApiError('inference_invalid_response');
    }
  }

  async function retrySource(id: string): Promise<SourceHealth[number]> {
    const response = await fetcher(new URL(`${baseUrl.replace(/\/$/, '')}/sources/${encodeURIComponent(id)}/retry`), { method: 'POST' });
    if (!response.ok) throw new Error('Could not retry the source.');
    return response.json() as Promise<SourceHealth[number]>;
  }

  return {
    getRegistry: () => get<Registry>('/registry'),
    getSourceHealth: () => get<SourceHealth>('/sources'),
    retrySource,
    getSnapshots: ({ domain } = {}) => get<Snapshots>(`/snapshots${domain ? `?domain=${encodeURIComponent(domain)}` : ''}`),
    getSignals: () => get<Signals>('/signals'),
    getDomains: () => get<Domains>('/domains'),
    createReview,
  };
}
