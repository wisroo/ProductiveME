import { runSyncCommand } from './cli.js';

try {
  const result = await runSyncCommand(process.argv.slice(2), process.cwd());
  console.log(`Sync complete: ${result.total} entries, ${result.errors} errors`);
  if (result.errors > 0) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Sync failed');
  process.exitCode = 1;
}
