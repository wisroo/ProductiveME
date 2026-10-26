import { runSyncCommand } from './cli.js';

try {
  const result = await runSyncCommand(process.argv.slice(2));
  console.log(JSON.stringify({ event: 'sync.completed', total: result.total, ok: result.total - result.errors, errors: result.errors }));
  if (result.errors > 0) process.exitCode = 1;
} catch {
  console.error(JSON.stringify({ event: 'sync.failed', error: 'sync failed' }));
  process.exitCode = 1;
}
