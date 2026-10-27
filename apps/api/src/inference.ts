export interface InferenceConfig {
  enabled: boolean;
  baseUrl?: string;
  model?: string;
  timeoutMs: number;
  contextTokens: number;
  maxOutputTokens: number;
}

export type InferenceErrorCode = 'disabled' | 'busy' | 'timeout' | 'upstream' | 'invalid_response';
const maxResponseBytes = 64 * 1024;

export class InferenceError extends Error {
  constructor(readonly code: InferenceErrorCode) {
    super(code);
    this.name = 'InferenceError';
  }
}

function integerSetting(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = env[name] ?? String(fallback);
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}`);
  }
  return value;
}

export function parseInferenceConfig(env: NodeJS.ProcessEnv = process.env): InferenceConfig {
  const rawUrl = env.INFERENCE_BASE_URL?.trim();
  const rawModel = env.INFERENCE_MODEL?.trim();
  const common = {
    timeoutMs: integerSetting(env, 'INFERENCE_TIMEOUT_MS', 30000, 100, 120000),
    contextTokens: integerSetting(env, 'INFERENCE_CONTEXT_TOKENS', 2048, 512, 8192),
    maxOutputTokens: integerSetting(env, 'INFERENCE_MAX_OUTPUT_TOKENS', 512, 1, 512),
  };
  if (common.contextTokens - common.maxOutputTokens < 512) {
    throw new Error('INFERENCE_CONTEXT_TOKENS must leave at least 512 tokens for the prompt');
  }
  if (!rawUrl && !rawModel) return { enabled: false, ...common };
  if (!rawUrl || !rawModel) throw new Error('INFERENCE_BASE_URL and INFERENCE_MODEL must both be configured');
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error('INFERENCE_BASE_URL must be a valid HTTP URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('INFERENCE_BASE_URL must use http or https without credentials, query, or fragment');
  }
  if (rawModel.length > 128 || /[\r\n]/.test(rawModel)) throw new Error('INFERENCE_MODEL must be at most 128 characters');
  return { enabled: true, baseUrl: url.toString().replace(/\/$/, ''), model: rawModel, ...common };
}

export interface InferenceProvider {
  generate(prompt: string): Promise<string>;
}

async function readBoundedJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxResponseBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new InferenceError('invalid_response');
  }
  if (!response.body) throw new InferenceError('invalid_response');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxResponseBytes) {
        await reader.cancel().catch(() => undefined);
        throw new InferenceError('invalid_response');
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof InferenceError) throw error;
    if (signal.aborted) throw new InferenceError('timeout');
    throw new InferenceError('upstream');
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new InferenceError('invalid_response');
  }
}

export function createOllamaInference(config: InferenceConfig, fetcher: typeof fetch = fetch): InferenceProvider {
  let busy = false;
  return {
    async generate(prompt: string): Promise<string> {
      if (!config.enabled || !config.baseUrl || !config.model) throw new InferenceError('disabled');
      if (busy) throw new InferenceError('busy');
      busy = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        let response: Response;
        try {
          response = await fetcher(`${config.baseUrl}/api/generate`, {
            method: 'POST', headers: { 'content-type': 'application/json' }, signal: controller.signal,
            body: JSON.stringify({
              model: config.model, prompt, stream: false, think: false,
              options: { num_ctx: config.contextTokens, num_predict: config.maxOutputTokens },
            }),
          });
        } catch {
          if (controller.signal.aborted) throw new InferenceError('timeout');
          throw new InferenceError('upstream');
        }
        if (!response.ok) {
          await response.body?.cancel().catch(() => undefined);
          throw new InferenceError('upstream');
        }
        const data = await readBoundedJson(response, controller.signal);
        if (!data || typeof data !== 'object' || !('response' in data) || typeof data.response !== 'string' || !data.response.trim()) {
          throw new InferenceError('invalid_response');
        }
        return data.response.trim().slice(0, 8000);
      } finally {
        clearTimeout(timer);
        busy = false;
      }
    },
  };
}
