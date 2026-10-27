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

  it('posts only the selected review period and returns the server range and draft', async () => {
    const response = {
      period: 'monthly',
      rangeStart: '2026-09-26T12:00:00.000Z',
      rangeEnd: '2026-10-26T12:00:00.000Z',
      draft: 'A review draft',
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), { status: 200 }),
    );

    await expect(createApiClient('http://localhost:5173/api', fetcher).createReview('monthly'))
      .resolves.toEqual(response);

    expect(fetcher).toHaveBeenCalledWith(new URL('http://localhost:5173/api/reviews'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ period: 'monthly' }),
    });
  });

  it('maps only recognized server error codes and does not expose arbitrary messages', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: 'inference_unavailable', message: 'secret endpoint detail' }), { status: 502 }),
    );

    await expect(createApiClient('http://localhost:3000', fetcher).createReview('weekly'))
      .rejects.toMatchObject({ code: 'inference_unavailable' });
    await expect(createApiClient('http://localhost:3000', fetcher).createReview('weekly'))
      .rejects.not.toThrow('secret endpoint detail');
  });

  it('uses a safe generic error for unknown codes and network failures', async () => {
    const serverError = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: 'internal', message: 'sensitive' }), { status: 500 }),
    );
    const networkError = vi.fn<typeof fetch>().mockRejectedValue(new Error('private host details'));

    await expect(createApiClient('http://localhost:3000', serverError).createReview('weekly'))
      .rejects.toMatchObject({ code: 'unknown' });
    await expect(createApiClient('http://localhost:3000', networkError).createReview('weekly'))
      .rejects.toThrow('Review generation request failed');
  });

  it('rejects a malformed successful review response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ period: 'weekly', rangeStart: 'not-a-date', rangeEnd: '2026-10-26T12:00:00.000Z', draft: 'draft' }), { status: 200 }),
    );

    await expect(createApiClient('http://localhost:3000', fetcher).createReview('weekly'))
      .rejects.toMatchObject({ code: 'inference_invalid_response' });
  });
});
