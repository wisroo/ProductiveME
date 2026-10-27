import { describe, expect, it, vi } from 'vitest';
import { createOllamaInference, parseInferenceConfig } from '../src/inference.js';

describe('inference configuration', () => {
  it('is disabled by default and accepts a bounded configured Ollama endpoint', () => {
    expect(parseInferenceConfig({})).toEqual({ enabled: false, contextTokens: 2048, maxOutputTokens: 512, timeoutMs: 30000 });
    expect(parseInferenceConfig({ INFERENCE_BASE_URL: 'http://wyse:11434', INFERENCE_MODEL: 'qwen2.5:3b' })).toEqual({
      enabled: true, baseUrl: 'http://wyse:11434', model: 'qwen2.5:3b', contextTokens: 2048, maxOutputTokens: 512, timeoutMs: 30000,
    });
  });

  it('rejects partial or invalid configuration and out-of-bound generation limits', () => {
    expect(() => parseInferenceConfig({ INFERENCE_MODEL: 'qwen2.5:3b' })).toThrow('INFERENCE_BASE_URL and INFERENCE_MODEL must both be configured');
    expect(() => parseInferenceConfig({ INFERENCE_BASE_URL: 'file:///tmp', INFERENCE_MODEL: 'm' })).toThrow('INFERENCE_BASE_URL must use http or https');
    expect(() => parseInferenceConfig({ INFERENCE_BASE_URL: 'http://localhost:11434', INFERENCE_MODEL: 'm', INFERENCE_CONTEXT_TOKENS: '8193' })).toThrow('INFERENCE_CONTEXT_TOKENS must be an integer from 512 to 8192');
    expect(() => parseInferenceConfig({ INFERENCE_BASE_URL: 'http://localhost:11434', INFERENCE_MODEL: 'm', INFERENCE_MAX_OUTPUT_TOKENS: '513' })).toThrow('INFERENCE_MAX_OUTPUT_TOKENS must be an integer from 1 to 512');
  });
});

describe('Ollama inference', () => {
  it('sends a bounded non-streaming generate request and validates its response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ response: 'A short draft.', done: true }), { status: 200 }));
    const inference = createOllamaInference({ enabled: true, baseUrl: 'http://wyse:11434', model: 'qwen2.5:3b', timeoutMs: 1000, contextTokens: 2048, maxOutputTokens: 512 }, fetcher);
    await expect(inference.generate('facts')).resolves.toBe('A short draft.');
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe('http://wyse:11434/api/generate');
    expect(JSON.parse(String(init?.body))).toEqual({ model: 'qwen2.5:3b', prompt: 'facts', stream: false, options: { num_ctx: 2048, num_predict: 512 } });
  });

  it('times out safely and does not leak upstream response bodies', async () => {
    const timeoutInference = createOllamaInference({ enabled: true, baseUrl: 'http://wyse:11434', model: 'm', timeoutMs: 1, contextTokens: 2048, maxOutputTokens: 512 }, (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    await expect(timeoutInference.generate('private prompt')).rejects.toMatchObject({ code: 'timeout' });

    const failed = createOllamaInference({ enabled: true, baseUrl: 'http://wyse:11434', model: 'm', timeoutMs: 1000, contextTokens: 2048, maxOutputTokens: 512 }, async () => new Response('private upstream body', { status: 500 }));
    await expect(failed.generate('private prompt')).rejects.toMatchObject({ code: 'upstream', message: 'upstream' });
  });

  it('rejects malformed output and permits only one concurrent generation', async () => {
    let release: ((response: Response) => void) | undefined;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    const inference = createOllamaInference({ enabled: true, baseUrl: 'http://wyse:11434', model: 'm', timeoutMs: 1000, contextTokens: 2048, maxOutputTokens: 512 }, fetcher);
    const first = inference.generate('first');
    await expect(inference.generate('second')).rejects.toMatchObject({ code: 'busy' });
    release?.(new Response(JSON.stringify({ response: 'done', done: true }), { status: 200 }));
    await expect(first).resolves.toBe('done');
    const malformed = createOllamaInference({ enabled: true, baseUrl: 'http://wyse:11434', model: 'm', timeoutMs: 1000, contextTokens: 2048, maxOutputTokens: 512 }, async () => new Response('{"response": 3}', { status: 200 }));
    await expect(malformed.generate('facts')).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
