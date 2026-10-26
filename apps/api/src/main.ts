import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { parseApiRuntimeConfig, registerGracefulShutdown } from './runtime.js';

const registryPath = fileURLToPath(new URL('../../../registry.yaml', import.meta.url));
const app = await buildApp({ registryPath });
const { host, port } = parseApiRuntimeConfig();
registerGracefulShutdown(app);
await app.listen({ port, host });
