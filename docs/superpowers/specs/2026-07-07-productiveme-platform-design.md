# ProductiveME Platform Design

- **Date**: 2026-07-07
- **Status**: Draft — awaiting owner review
- **Source brief**: `docs/productive-me-dashboard-brief.md`

## 1. Purpose

ProductiveME is a personal productivity control plane over four fixed life
domains — Career, Finance, Personal Data, Life. It reads from external source
systems (Notion, GitHub, Google Tasks, local folders, finance records),
summarizes their state, and answers one question: **what should I pay
attention to next?**

This project has a second, equally important purpose: it is a **training
ground for tech-lead and senior-engineer skills**. The architecture is
deliberately production-shaped — separate services, contracts, CI/CD, cloud
deployment, observability, LLM integration — so that building it teaches the
skills that US product companies (target: Disney Experiences digital /
full-stack roles) hire for. Where "simplest possible" and "production-shaped"
conflict, production-shaped wins if it teaches a named skill; otherwise
simplest wins.

## 2. Non-Goals

- Not a source of truth: Notion, GitHub, and the file system keep owning
  their data. ProductiveME stores only its registry, snapshots, and reviews.
- Not a task manager, note app, or finance tracker replacement.
- No multi-user support, auth systems, or public deployment. One user.
- No real-time sync. Freshness is snapshot-based (minutes/hours, not seconds).

## 3. Architecture Overview

```
External systems (Notion, GitHub, Google Tasks, folders, finance)
        │  one Connector per system, run in parallel
        ▼
apps/sync      — scheduled worker: runs connectors, writes Snapshots
        │  Snapshot files (JSON on disk → SQLite later if needed)
        ▼
packages/core  — pure library: domain types, registry schema,
                 signal rules engine. No I/O, no framework imports.
        ▼
apps/api       — REST service (Fastify): serves registry, snapshots,
                 signals, domains; generates LLM review drafts.
        │  HTTP + OpenAPI-generated typed client
        ▼
apps/web       — React SPA (Vite): Home, Domain Detail, Review, Registry.
                 TanStack Query, per-source parallel fetching.
```

**Monorepo**: pnpm workspaces. Packages: `packages/core`, `apps/api`,
`apps/sync`, `apps/web`. TypeScript throughout Phases 0–3; the sync worker's
language (TS vs Python) is an explicit decision point at Phase 4.

**Key seams** (each can change internally without breaking the others):

1. **Registry file → everything**: what ProductiveME knows about.
2. **Connector interface → sync**: how external data becomes Snapshots.
3. **Snapshot store → core/api**: how state is read. Starts as JSON files.
4. **REST API → web**: the only path the frontend uses to reach data.

## 4. Data Model (`packages/core`)

- **DomainId**: `'career' | 'finance' | 'personal-data' | 'life'` — fixed.
- **Subdomain**: per brief §4 (career: work/study/dream; finance: cashflow/
  assets/spending/portfolio; personal-data: photos/music/videos/files/
  archives; life: travel/exercise/games/church/rest/relationships/other).
- **RegistryEntry**: one connected thing.
  `{ id, name, kind: 'repo' | 'notion-page' | 'folder' | 'tool' | 'project',
     domain, subdomain?, locator (url or path), connector: ConnectorId,
     cadence?: Cadence }`
  - `cadence` (`'weekly' | 'monthly' | 'quarterly'`) means "this entry is
    supposed to receive attention this often." The rules engine emits a
    `due` signal when `now - lastTouched > cadence`. It is about the user's
    rhythm, not sync frequency. Entries without cadence never emit due
    signals.
- **Snapshot**: frozen result of one sync run for one entry.
  `{ entryId, fetchedAt, status: 'ok' | 'error', items: SnapshotItem[],
     error?: string }`
  - `SnapshotItem`: `{ title, detail?, timestamp?, link? }` — deliberately
    generic; connectors map source-specific data into it.
  - Purpose: decouple UI from live external systems (instant, offline,
    per-source failure isolation) and accumulate history for reviews.
- **Signal**: rules-engine output.
  `{ severity: 'info' | 'due' | 'warning' | 'blocked', domain, entryId?,
     message, suggestedAction? }`
  - Severity maps to the brief's color semantics: amber = due, soft red =
    blocked/error.
- **Review**: `{ id, period: 'weekly' | 'monthly', rangeStart, rangeEnd,
  draft, finalized?: boolean }`.

## 5. Registry

- Single `registry.yaml` at repo root. Human-edited, git-diffable.
- Validated with zod in `packages/core`; invalid entries fail loudly with
  a path to the offending field.
- Read-only in the app for MVP (edit the YAML by hand); the Registry screen
  displays it.

## 6. Connector Interface

```ts
interface Connector {
  id: ConnectorId;                       // 'static-file' | 'local-folder' | 'github' | 'notion' | ...
  load(entry: RegistryEntry): Promise<Snapshot>;
}
```

- MVP connectors: `static-file` (reads a fixture JSON) and `local-folder`
  (stats a directory — real data, zero auth).
- Later connectors: `github` (PAT), `notion` (integration token),
  `google-tasks` (OAuth). Each is added without changing core, api, or web.
- Connectors run in parallel; one failure produces an `error` Snapshot and
  a `blocked` signal, never a crashed sync run.

## 7. Signal Rules Engine

Pure functions in `packages/core`:
`computeSignals(registry, snapshots, now) → Signal[]`.

Initial rules:

1. **review-due**: entry with cadence not touched within its cadence window.
2. **connector-blocked**: latest snapshot for an entry has `status: 'error'`.
3. **domain-neglected**: no activity in any of a domain's entries for N days
   (N per domain, default 14).
4. **career-life-imbalance**: career activity count exceeds life activity
   count by a configurable ratio over the trailing 2 weeks.

All rules unit-tested with fixed `now` values. Adding a rule is the standard
extension exercise.

## 8. API Service (`apps/api`)

- Fastify + TypeScript. Routes:
  - `GET /registry` — validated registry entries
  - `GET /snapshots?domain=` — latest snapshot per entry
  - `GET /signals` — computed signals
  - `GET /domains` — per-domain rollup (health, counts, latest activity)
  - `POST /reviews` — generate a review draft (LLM; see §11)
  - `GET /healthz` — liveness for Phase 5
- OpenAPI document generated from route schemas; the web client is generated
  from it (contract-first: the spec is the contract, not the TS import).
- Integration-tested with real snapshot fixtures on disk.

## 9. Frontend (`apps/web`)

- Vite + React + TypeScript + TanStack Query.
- Pages (from brief §15): Home, Domain Detail (one component, four domain
  configs), Review, Registry. React Router.
- Parallelism rule: every card/section issues its own query keyed per
  concern (`['signals']`, `['domain', id]`…). Loading and error states are
  per-card; a dead API section never blanks the page.
- Visual direction: **not yet chosen** (mockups in `docs/mockups/`). The
  Phase 3 shell starts from neutral structure + design tokens so a mockup
  direction can be applied without rearchitecting. Choosing the direction is
  an open decision (§14).

## 10. Sync Service (`apps/sync`)

- Scheduled worker (node-cron initially; OS cron/CI cron acceptable): loads
  registry, runs all connectors concurrently (`Promise.allSettled`), writes
  snapshot files atomically.
- CLI entry (`pnpm sync run`) for manual runs from day one.
- **Decision point (Phase 4)**: keep in TypeScript, or rewrite in Python
  (FastAPI/apscheduler) as the polyglot/contract exercise aligned with a
  studio career path. Deferred until the owner's Disney target is clearer.

## 11. LLM Review Generation (Phase 6)

- `POST /reviews` gathers the period's snapshots + signals + registry into a
  structured context, calls the Claude API, and returns a drafted weekly or
  monthly review (summary per domain, notable changes, suggested focus).
- Drafts are editable and saved locally; the LLM never writes anywhere else.
- Model/prompt/cost specifics decided in the Phase 6 spec.

## 12. CI/CD, Deployment, Observability (Phase 5 — weighted)

- GitHub Actions from Phase 0: lint (eslint), typecheck, test (vitest) on
  every PR; merges to `main` blocked on green.
- Phase 5 adds: Docker images for api and sync; deploy to a small AWS
  target (single EC2/Lightsail or ECS — decided in the Phase 5 spec);
  structured JSON logs (pino); `/healthz`; basic CloudWatch metrics/alarms.
- Rationale: microservices + CI/CD + Docker + AWS + observability appear in
  every target job posting; this phase is the portfolio centerpiece.

## 13. Development Process (the tech-lead loop)

Every phase runs the same cycle, with the owner in the tech-lead seat:

1. Owner approves a short phase spec (this document is the umbrella).
2. Implementation plan written (writing-plans skill); tasks sized for
   parallel Claude Code agents in git worktrees where independent.
3. Agents implement TDD-first; work lands via PRs.
4. Owner reviews PRs; CI gates the merge.
5. Each phase produces an ADR in `docs/adr/` recording the decision made
   and alternatives rejected.

## 14. Roadmap and Open Decisions

| Phase | Deliverable | Success criteria |
|---|---|---|
| 0 | Monorepo scaffold, CI skeleton, ADR-0001 (stack) | PR with failing lint blocks merge; `pnpm test` runs in CI |
| 1 | `packages/core`: types, registry schema, rules engine (TDD) | All rules unit-tested; invalid registry fails validation with clear error |
| 2 | `apps/api` + OpenAPI + snapshot fixtures | Integration tests green; typed client generates from OpenAPI |
| 3 | `apps/web`: 4 pages against real API | Pages render real fixture data; per-card error isolation demonstrated |
| 4 | `apps/sync` + local-folder + GitHub connectors | Scheduled run writes snapshots; one failing connector doesn't block others |
| 5 | Docker, AWS deploy, logs/metrics/health | Dashboard reachable on AWS; a killed api container is visible in metrics |
| 6 | LLM weekly/monthly review generation | One-click review draft grounded in real snapshot history |

Open decisions (each gets an ADR when made):

1. **Visual direction** — which `docs/mockups/` direction wins (blocks Phase 3 polish, not Phase 3 start).
2. **Real registry inventory** — owner's actual repos/Notion pages/folders (placeholder entries until provided).
3. **Sync worker language** — TS vs Python (Phase 4).
4. **AWS deployment target** — EC2/Lightsail vs ECS (Phase 5).
5. **Snapshot store** — JSON files vs SQLite (revisit when history queries appear, likely Phase 6).

## 15. Testing Strategy

- `packages/core`: pure unit tests (vitest), fixed clocks, no mocks needed.
- `apps/api`: integration tests against fixture snapshots on disk.
- `apps/web`: component tests for signal/domain rendering states
  (ok/due/blocked/loading); no e2e until Phase 5.
- `apps/sync`: connector contract tests — every connector must produce a
  valid Snapshot for both success and failure inputs.

## 16. Error Handling Principles

- External systems are assumed unreliable: every failure becomes an `error`
  Snapshot + `blocked` signal, rendered as state, never thrown to the user.
- Registry validation errors fail loudly at load time (bad config is a
  developer error, not a runtime state).
- The web app treats every query as independently fallible; there is no
  global error screen for a partial failure.
