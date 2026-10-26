export interface ApiRuntimeConfig {
  host: string;
  port: number;
}

export function parseApiRuntimeConfig(env: NodeJS.ProcessEnv = process.env): ApiRuntimeConfig {
  const host = env.API_HOST ?? '127.0.0.1';
  const rawPort = env.API_PORT ?? '3000';
  const port = Number(rawPort);
  if (!host.trim()) throw new Error('API_HOST must be a non-empty host name or IP address');
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer from 1 to 65535');
  }
  return { host: host.trim(), port };
}

interface SignalSource {
  once(event: NodeJS.Signals, listener: () => void): unknown;
}

interface ClosableApi {
  close(): Promise<void>;
}

export function registerGracefulShutdown(app: ClosableApi, signals: SignalSource = process): void {
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    signals.once(signal, () => {
      void app.close().catch(() => {
        console.error(JSON.stringify({ event: 'api.shutdown.failed', error: 'API shutdown failed' }));
        process.exitCode = 1;
      });
    });
  }
}
