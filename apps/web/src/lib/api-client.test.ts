import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '@productiveme/api-client';

describe('generated API client URLs', () => {
  it('preserves the configured /api prefix', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('[]', { status: 200 }),
    );

    await createApiClient('http://localhost:5173/api', fetcher).getRegistry();

    expect(fetcher).toHaveBeenCalledWith(new URL('http://localhost:5173/api/registry'));
  });

  it('supports an API origin without a path prefix', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('[]', { status: 200 }),
    );

    await createApiClient('http://localhost:3000', fetcher).getRegistry();

    expect(fetcher).toHaveBeenCalledWith(new URL('http://localhost:3000/registry'));
  });
});
