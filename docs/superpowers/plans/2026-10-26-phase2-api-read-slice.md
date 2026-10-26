# Phase 2 API Read Slice

## Contract

- Keep `GET /registry` and add `GET /snapshots`, `GET /signals`,
  `GET /domains`, and generated `GET /openapi.json`.
- Store snapshots as JSON files grouped by entry ID:
  `<snapshotDir>/<entryId>/<file>.json`. Validate every file at runtime.
- For each registry entry, choose the valid snapshot with greatest
  `fetchedAt`; ties sort by filename. Ignore invalid snapshots when a valid
  one exists. If none exists, return a synthetic `error` snapshot that says
  whether the source is missing or contains no valid snapshots. Its `fetchedAt`
  is the request clock time. Normalize valid snapshot and item timestamps to
  UTC ISO strings after validation. One entry's read/parse/validation failure
  must not hide other entries' good data.
- Only registry IDs matching a safe single path segment are read from disk;
  an unsafe ID becomes an isolated error snapshot.
- `GET /snapshots?domain=` accepts only the four core domain IDs and returns
  latest snapshots for registered entries (including error snapshots).
- `GET /signals` calls Core `computeSignals` over those latest snapshots and
  an injectable ISO clock.
- `GET /domains` always includes all four domains. Health is `healthy` when
  every registered entry is `ok`, `degraded` when some are `ok` and some
  errored, and `unavailable` when the domain has no entries or all entries
  errored. Counts include entries, healthy/error sources, and snapshot items;
  latest activity is the newest item timestamp from `ok` snapshots.
- OpenAPI is built from Fastify route schemas; a repeatable command writes
  generated client types from that document. No connectors, auth, writes, or
  web integration are included.

## Plan and verification

1. Add fixture-backed integration tests for the contract and verify they fail.
2. Implement file loading, isolated source errors, and read routes; rerun API
   integration tests.
3. Add OpenAPI generation and generated typed fetch client, then verify the
   generation command and contract shape.
4. Run repository test, typecheck, lint, and `git diff --check`; review only
   scoped changes and commit them.
