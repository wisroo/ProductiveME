# Phase 3 Web API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Home and Domain Detail to the read API with independently loading, retryable sections while preserving the prototype UI.

**Architecture:** Use the generated API client through TanStack Query, with a Vite `/api` proxy and a client base URL that preserves path prefixes. Home reads domain rollups and signals; Domain Detail independently reads registry entries, domain snapshots, and domain signals. Existing static panels remain labeled prototype data.

**Tech Stack:** React, TypeScript, TanStack Query, generated `@productiveme/api-client`, Vite, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-07-productiveme-platform-design.md` §8–9.

## Global Constraints

- One user, no auth, and no real-time sync; freshness is snapshot-based.
- The REST API is the only frontend data path.
- Every section has its own query key, loading/error state, and retry; one failed section must not blank the page.
- Keep existing visual tokens/navigation and avoid inventing write behavior.

## Review Focus

- `/api` requests must reach API routes, including generated client path-prefix handling.
- Empty registry, snapshots, or signals must render useful empty states.
- A failed query must leave sibling query results visible and retry only its own data.
- Switching domains must not show a prior domain's cached result as the selected domain's data.
- The API's `personal-data` ID must map to the UI's `pdata` tab.

### Task 1: Client URL and Web API Query Setup

**Files:** Modify `packages/api-client/src/index.ts`; create `apps/web/src/lib/api.ts`; modify `apps/web/src/main.tsx`, `apps/web/vite.config.ts`, `apps/web/package.json`; update lockfile.

- [ ] Test real generated-client URLs with a fetcher for root and `/api` base URLs.
- [ ] Fix path-prefix joining and verify the test fails before the fix.
- [ ] Add TanStack Query provider and query hooks for rollups, signals, registry, and snapshots.
- [ ] Verify client and web typechecks.

### Task 2: Live Home Sections

**Files:** Modify `apps/web/src/components/Home.tsx` and `Home.test.tsx`.

- [ ] Test rollup/signal mapping, loading, empty, failure with sibling content, and retry.
- [ ] Render live domain health/counts and signals using independent sections; remove misleading static Home metrics.
- [ ] Verify the Home component tests.

### Task 3: Live Domain Detail Sections

**Files:** Modify `apps/web/src/components/Domains.tsx` and `Domains.test.tsx`.

- [ ] Test domain-filtered API data, independent loading/error/empty/retry, and switching IDs.
- [ ] Render registry entries, snapshots, and signals per selected domain; label remaining illustrative panels as prototype data.
- [ ] Verify the Domain component tests.

### Task 4: Startup Documentation and Verification

**Files:** Modify `README.md`.

- [ ] Document API and Web startup commands, proxy behavior, snapshot directory, and empty/no-snapshot display.
- [ ] Run repository test, typecheck, lint, Web build, and `git diff --check`; review and commit only scoped changes.
