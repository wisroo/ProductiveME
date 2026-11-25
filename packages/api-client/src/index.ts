import type { paths } from './openapi.js';

type SourceHealth = paths['/sources']['get']['responses'][200]['content']['application/json'];
type Registry = paths['/registry']['get']['responses'][200]['content']['application/json'];
type Snapshots = paths['/snapshots']['get']['responses'][200]['content']['application/json'];
type Signals = paths['/signals']['get']['responses'][200]['content']['application/json'];
type Domains = paths['/domains']['get']['responses'][200]['content']['application/json'];
type SnapshotQuery = NonNullable<paths['/snapshots']['get']['parameters']['query']>;
type TaskRoute = paths['/tasks'];
export type Task = TaskRoute['get']['responses'][200]['content']['application/json'][number];
export type TaskInput = TaskRoute['post']['requestBody']['content']['application/json'];
type TaskQuery = TaskRoute['get']['parameters']['query'];
type TaskPatch = paths['/tasks/{id}']['patch']['requestBody']['content']['application/json'];

export class TaskApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

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
  getTasks(options: TaskQuery): Promise<Task[]>;
  createTask(input: TaskInput, force?: boolean): Promise<Task>;
  updateTask(id: string, patch: TaskPatch, force?: boolean): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  restoreTask(id: string): Promise<Task>;
  carryTask(id: string, toWeek: string, force?: boolean): Promise<Task>;
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

  async function taskRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
    const response = await fetcher(new URL(`${baseUrl.replace(/\/$/, '')}${path}`), {
      method,
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null) as { code?: string; message?: string } | null;
      throw new TaskApiError(error?.code ?? 'TASK_REQUEST_FAILED', error?.message ?? 'Task request failed.');
    }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  }

  return {
    getRegistry: () => get<Registry>('/registry'),
    getSourceHealth: () => get<SourceHealth>('/sources'),
    retrySource,
    getTasks: ({ week, domain }) => taskRequest<Task[]>(`/tasks?${new URLSearchParams({ week, ...(domain ? { domain } : {}) })}`, 'GET'),
    createTask: (input, force) => taskRequest<Task>(`/tasks${force ? '?force=1' : ''}`, 'POST', input),
    updateTask: (id, patch, force) => taskRequest<Task>(`/tasks/${encodeURIComponent(id)}${force ? '?force=1' : ''}`, 'PATCH', patch),
    deleteTask: (id) => taskRequest<void>(`/tasks/${encodeURIComponent(id)}`, 'DELETE'),
    restoreTask: (id) => taskRequest<Task>(`/tasks/${encodeURIComponent(id)}/restore`, 'POST'),
    carryTask: (id, toWeek, force) => taskRequest<Task>(`/tasks/${encodeURIComponent(id)}/carry${force ? '?force=1' : ''}`, 'POST', { toWeek }),
    getSnapshots: ({ domain } = {}) => get<Snapshots>(`/snapshots${domain ? `?domain=${encodeURIComponent(domain)}` : ''}`),
    getSignals: () => get<Signals>('/signals'),
    getDomains: () => get<Domains>('/domains'),
    createReview,
  };
}
