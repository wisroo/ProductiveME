# Phase 4 Sync Design

- **Intent:** Turn validated registry entries into API-readable snapshot history through a manual TypeScript CLI and an OS-scheduled invocation.
- **Approach:** Run the registry's connectors concurrently in `apps/sync`; persist each validated result atomically at `snapshots/<entryId>/<fetchedAt>.json`. Node's built-in fetch and filesystem APIs keep the worker dependency-light. An in-process interval loop was considered, but OS cron keeps scheduling restart-safe and is already allowed by the platform design.
- **Connectors:** `static-file` reads an explicit local JSON fixture; `local-folder` describes immediate non-symlink children; `github` reads public or token-authorized repository metadata and recent events over REST. Locator, connector, read, HTTP, and malformed-output failures become isolated error Snapshots.
- **Safety:** Validate each connector result against the Snapshot contract, sanitize persisted errors, and reject unsafe IDs and symlinked snapshot destinations. Do not recurse folders, follow child symlinks, persist credentials, or require real GitHub credentials in tests.
- **Out of scope:** External scheduler installation, credentials setup, registry inventory, real snapshot generation, and changes to API or core contracts.
- **Acceptance:** `pnpm sync run` reads `registry.yaml`, fetches an injectable UTC clock, runs entries concurrently, and saves API-compatible JSON. A documented cron example repeats the same command.
