import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';

const registryPath = fileURLToPath(new URL('../../../registry.yaml', import.meta.url));
const app = await buildApp({ registryPath });
await app.listen({ port: 3000, host: '127.0.0.1' });
