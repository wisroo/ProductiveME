export interface InferenceConfig {
  enabled: boolean;
  baseUrl?: string;
  model?: string;
  timeoutMs: number;
  contextTokens: number;
  maxOutputTokens: number;
}

export type InferenceErrorCode = 'disabled' | 'busy' | 'timeout' | 'upstream' | 'invalid_response';

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
              model: config.model, prompt, stream: false,
              options: { num_ctx: config.contextTokens, num_predict: config.maxOutputTokens },
            }),
          });
        } catch {
          if (controller.signal.aborted) throw new InferenceError('timeout');
          throw new InferenceError('upstream');
        }
        if (!response.ok) throw new InferenceError('upstream');
        let data: unknown;
        try { data = await response.json(); } catch {
          if (controller.signal.aborted) throw new InferenceError('timeout');
          throw new InferenceError('invalid_response');
        }
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
