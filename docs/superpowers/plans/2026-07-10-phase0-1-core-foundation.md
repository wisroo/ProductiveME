# Phase 0–1: Monorepo Foundation + Core Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the ProductiveME pnpm monorepo with CI, then build `packages/core` — domain types, registry validation, and the signal rules engine — fully TDD.

**Architecture:** pnpm-workspaces monorepo (`packages/core` now; `apps/*` in later phases). `packages/core` is a pure TypeScript library: no I/O, no framework imports, every function deterministic (time is always passed in as an ISO string). Registry YAML is validated with zod; signal rules are pure functions `(entries, snapshots, now) → Signal[]`.

**Tech Stack:** Node ≥22, pnpm 10, TypeScript ^5.8 (strict, ESM), vitest ^3, zod ^3.25, yaml ^2.8, eslint 9 flat config + typescript-eslint 8, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-07-07-productiveme-platform-design.md` (§4–§7, §12 CI skeleton, Phase 0–1 rows of §14).

## Global Constraints

- All packages are ESM (`"type": "module"`); imports between local files use `.js` extensions (NodeNext resolution).
- TypeScript `strict: true` and `noUncheckedIndexedAccess: true` everywhere.
- `packages/core/src` must not import Node built-ins (`fs`, `path`, …) — the library is I/O-free; reading files is the caller's job. Test files may use `node:fs` to load fixtures.
- No `Date.now()` / `new Date()` without arguments anywhere in core. `now` is always a parameter (ISO-8601 string). Timestamps are ISO-8601 strings compared lexically or via `daysBetween`.
- Domain ids are exactly: `career`, `finance`, `personal-data`, `life`.
- Severity semantics: `due` = amber/attention, `blocked` = connector/sync failure, `warning` = neglect/imbalance, `info` = neutral.
- Run all commands from the repo root: `/Users/a11791/Documents/ProductiveME`.
- Commit after every green test cycle; never commit with failing tests.

---

### Task 1: Monorepo scaffold + ADR-0001

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `docs/adr/0001-typescript-monorepo.md`
- Test: `packages/core/test/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: workspace commands later tasks rely on — `pnpm test`, `pnpm typecheck` run from root; `@productiveme/core` package with `src/` + `test/` layout.

- [ ] **Step 1: Create root workspace files**

`package.json`:

```json
{
  "name": "productiveme",
  "private": true,
  "packageManager": "pnpm@10.12.1",
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "lint": "eslint ."
  },
  "devDependencies": {
    "eslint": "^9.29.0",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.34.0"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
  - apps/*
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`.gitignore`:

```
node_modules/
dist/
coverage/
*.log
.DS_Store
```

- [ ] **Step 2: Create packages/core skeleton**

`packages/core/package.json`:

```json
{
  "name": "@productiveme/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "yaml": "^2.8.0",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "vitest": "^3.2.0"
  }
}
```

`packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src", "test"]
}
```

`packages/core/src/index.ts`:

```ts
export const CORE_PACKAGE = '@productiveme/core';
```

- [ ] **Step 3: Write the smoke test**

`packages/core/test/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CORE_PACKAGE } from '../src/index.js';

describe('workspace smoke', () => {
  it('resolves the core package', () => {
    expect(CORE_PACKAGE).toBe('@productiveme/core');
  });
});
```

- [ ] **Step 4: Install and verify**

Run: `pnpm install`
Expected: lockfile created, no errors.

Run: `pnpm test`
Expected: `1 passed` (smoke test).

Run: `pnpm typecheck`
Expected: exits 0.

- [ ] **Step 5: Write ADR-0001**

`docs/adr/0001-typescript-monorepo.md`:

```markdown
# ADR-0001: Single-language TypeScript monorepo

- Status: accepted
- Date: 2026-07-10

## Context

ProductiveME is a control-plane platform (core library, API service, sync
worker, React frontend) built by one person, doubling as tech-lead training
targeting US full-stack roles (Disney Experiences digital profile:
TypeScript/React/Node/AWS). Alternatives considered: Python (FastAPI)
backend, Java/Spring backend, polyglot sync worker.

## Decision

One pnpm-workspaces monorepo, TypeScript everywhere. Contracts live in
`packages/core` (shared types) and, from Phase 2, an OpenAPI document.
Studio-path skills (C++/graphics) are pursued in a separate study track
outside this repository.

## Consequences

- One toolchain (pnpm, vitest, eslint, tsc) — minimum friction for a solo
  developer; compile-time contract checks across all services.
- No polyglot service-boundary practice inside this repo; OpenAPI-generated
  clients (Phase 2) provide the language-neutral contract lesson instead.
- Java/Spring exposure deferred; can be added later by rewriting one
  service if a Java-heavy role becomes the target.
```

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore packages/core docs/adr pnpm-lock.yaml
git commit -m "chore: scaffold pnpm monorepo with core package and ADR-0001"
```

---

### Task 2: Lint config + CI workflow

**Files:**
- Create: `eslint.config.js`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: root scripts from Task 1 (`pnpm lint`, `pnpm typecheck`, `pnpm test`).
- Produces: green-CI gate all later tasks must keep green.

- [ ] **Step 1: Create eslint flat config**

`eslint.config.js`:

```js
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] },
  ...tseslint.configs.recommended,
);
```

- [ ] **Step 2: Run lint, verify it passes**

Run: `pnpm lint`
Expected: exits 0, no errors.

- [ ] **Step 3: Prove the gate catches failures**

Temporarily add `const unused = 1;` to `packages/core/src/index.ts`, run `pnpm lint`, expect an `@typescript-eslint/no-unused-vars` error, then remove the line and re-run to green. (This is the "failing lint blocks merge" success criterion from the spec, verified locally.)

- [ ] **Step 4: Create the CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js .github/workflows/ci.yml
git commit -m "ci: add eslint flat config and GitHub Actions pipeline"
```

---

### Task 3: Domain types and constants

**Files:**
- Create: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/test/smoke.test.ts`
- Test: `packages/core/test/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by every later task):
  - `DOMAIN_IDS: readonly ['career','finance','personal-data','life']`, `type DomainId`
  - `SUBDOMAINS: Record<DomainId, readonly string[]>`
  - `CADENCES: readonly ['weekly','monthly','quarterly']`, `type Cadence`
  - `type EntryKind = 'repo'|'notion-page'|'folder'|'tool'|'project'`
  - `interface RegistryEntry { id; name; kind; domain; subdomain?; locator; connector; cadence? }`
  - `interface SnapshotItem { title; detail?; timestamp?; link? }`
  - `interface Snapshot { entryId; fetchedAt; status: 'ok'|'error'; items: SnapshotItem[]; error? }`
  - `type SignalSeverity = 'info'|'due'|'warning'|'blocked'`
  - `interface Signal { severity; domain; entryId?; message; suggestedAction? }`
  - `isDomainId(value: string): value is DomainId`

- [ ] **Step 1: Write the failing test**

`packages/core/test/types.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CADENCES, DOMAIN_IDS, SUBDOMAINS, isDomainId } from '../src/types.js';

describe('domain constants', () => {
  it('defines exactly the four fixed domains, in brief order', () => {
    expect(DOMAIN_IDS).toEqual(['career', 'finance', 'personal-data', 'life']);
  });

  it('defines subdomains for every domain', () => {
    expect(Object.keys(SUBDOMAINS).sort()).toEqual([...DOMAIN_IDS].sort());
    expect(SUBDOMAINS.career).toEqual(['work', 'study', 'dream']);
    expect(SUBDOMAINS.life).toContain('rest');
  });

  it('defines the three cadences', () => {
    expect(CADENCES).toEqual(['weekly', 'monthly', 'quarterly']);
  });
});

describe('isDomainId', () => {
  it('accepts valid domain ids', () => {
    expect(isDomainId('personal-data')).toBe(true);
  });

  it('rejects unknown ids', () => {
    expect(isDomainId('productivity')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @productiveme/core test`
Expected: FAIL — cannot find module `../src/types.js`.

- [ ] **Step 3: Write the implementation**

`packages/core/src/types.ts`:

```ts
export const DOMAIN_IDS = ['career', 'finance', 'personal-data', 'life'] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];

export const SUBDOMAINS: Record<DomainId, readonly string[]> = {
  career: ['work', 'study', 'dream'],
  finance: ['cashflow', 'assets', 'spending', 'portfolio'],
  'personal-data': ['photos', 'music', 'videos', 'files', 'archives'],
  life: ['travel', 'exercise', 'games', 'church', 'rest', 'relationships', 'other'],
};

export const CADENCES = ['weekly', 'monthly', 'quarterly'] as const;
export type Cadence = (typeof CADENCES)[number];

export type EntryKind = 'repo' | 'notion-page' | 'folder' | 'tool' | 'project';

export interface RegistryEntry {
  id: string;
  name: string;
  kind: EntryKind;
  domain: DomainId;
  subdomain?: string;
  /** URL or filesystem path identifying the thing in its source system. */
  locator: string;
  /** Connector id, e.g. 'static-file', 'local-folder', 'github'. */
  connector: string;
  /** How often this entry should receive the user's attention. */
  cadence?: Cadence;
}

export interface SnapshotItem {
  title: string;
  detail?: string;
  /** ISO-8601. */
  timestamp?: string;
  link?: string;
}

export interface Snapshot {
  entryId: string;
  /** ISO-8601 time of the sync run. */
  fetchedAt: string;
  status: 'ok' | 'error';
  items: SnapshotItem[];
  error?: string;
}

export type SignalSeverity = 'info' | 'due' | 'warning' | 'blocked';

export interface Signal {
  severity: SignalSeverity;
  domain: DomainId;
  entryId?: string;
  message: string;
  suggestedAction?: string;
}

export function isDomainId(value: string): value is DomainId {
  return (DOMAIN_IDS as readonly string[]).includes(value);
}
```

Replace the content of `packages/core/src/index.ts` with:

```ts
export * from './types.js';
```

Update `packages/core/test/smoke.test.ts` to match (the placeholder constant is gone):

```ts
import { describe, expect, it } from 'vitest';
import { DOMAIN_IDS } from '../src/index.js';

describe('workspace smoke', () => {
  it('resolves the core package', () => {
    expect(DOMAIN_IDS.length).toBe(4);
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @productiveme/core test`
Expected: PASS (types + smoke). Also run `pnpm typecheck` — exits 0.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src packages/core/test
git commit -m "feat(core): add domain model types and constants"
```

---

### Task 4: Registry schema and parser

**Files:**
- Create: `packages/core/src/registry.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/registry.test.ts`

**Interfaces:**
- Consumes: `DOMAIN_IDS`, `CADENCES`, `RegistryEntry` from `types.ts`.
- Produces:
  - `parseRegistry(yamlText: string): RegistryEntry[]` — throws on invalid input
  - `class RegistryValidationError extends Error`

- [ ] **Step 1: Write the failing tests**

`packages/core/test/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { RegistryValidationError, parseRegistry } from '../src/registry.js';

const VALID = `
entries:
  - id: career-work-notes
    name: Work notes
    kind: notion-page
    domain: career
    subdomain: work
    locator: https://www.notion.so/example
    connector: static-file
  - id: finance-snapshot
    name: Monthly asset snapshot
    kind: tool
    domain: finance
    locator: file:///finance/snapshot
    connector: static-file
    cadence: monthly
`;

describe('parseRegistry', () => {
  it('parses a valid registry', () => {
    const entries = parseRegistry(VALID);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.domain).toBe('career');
    expect(entries[1]?.cadence).toBe('monthly');
  });

  it('rejects an unknown domain with the offending path in the message', () => {
    const bad = VALID.replace('domain: career', 'domain: productivity');
    expect(() => parseRegistry(bad)).toThrow(RegistryValidationError);
    expect(() => parseRegistry(bad)).toThrow(/entries\.0\.domain/);
  });

  it('rejects a missing required field', () => {
    const bad = VALID.replace('    locator: https://www.notion.so/example\n', '');
    expect(() => parseRegistry(bad)).toThrow(/entries\.0\.locator/);
  });

  it('rejects an invalid cadence', () => {
    const bad = VALID.replace('cadence: monthly', 'cadence: daily');
    expect(() => parseRegistry(bad)).toThrow(/entries\.1\.cadence/);
  });

  it('rejects duplicate entry ids', () => {
    const bad = VALID.replaceAll('finance-snapshot', 'career-work-notes');
    expect(() => parseRegistry(bad)).toThrow(/duplicate entry id "career-work-notes"/);
  });

  it('rejects non-object yaml', () => {
    expect(() => parseRegistry('just a string')).toThrow(RegistryValidationError);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @productiveme/core test registry`
Expected: FAIL — cannot find module `../src/registry.js`.

- [ ] **Step 3: Write the implementation**

`packages/core/src/registry.ts`:

```ts
import { parse } from 'yaml';
import { z } from 'zod';
import { CADENCES, DOMAIN_IDS, type RegistryEntry } from './types.js';

export class RegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryValidationError';
  }
}

const entrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['repo', 'notion-page', 'folder', 'tool', 'project']),
  domain: z.enum(DOMAIN_IDS),
  subdomain: z.string().min(1).optional(),
  locator: z.string().min(1),
  connector: z.string().min(1),
  cadence: z.enum(CADENCES).optional(),
});

const registrySchema = z
  .object({ entries: z.array(entrySchema) })
  .superRefine((registry, ctx) => {
    const seen = new Set<string>();
    registry.entries.forEach((entry, index) => {
      if (seen.has(entry.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', index, 'id'],
          message: `duplicate entry id "${entry.id}"`,
        });
      }
      seen.add(entry.id);
    });
  });

export function parseRegistry(yamlText: string): RegistryEntry[] {
  const data: unknown = parse(yamlText);
  const result = registrySchema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new RegistryValidationError(`invalid registry: ${details}`);
  }
  return result.data.entries;
}
```

Append to `packages/core/src/index.ts`:

```ts
export * from './registry.js';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @productiveme/core test`
Expected: PASS, all files.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src packages/core/test
git commit -m "feat(core): add zod-validated registry parser"
```

---

### Task 5: Snapshot helpers

**Files:**
- Create: `packages/core/src/signals/helpers.ts`
- Test: `packages/core/test/signals/helpers.test.ts`

**Interfaces:**
- Consumes: `Snapshot` from `types.ts`.
- Produces (used by every rule in Tasks 6–9):
  - `latestSnapshots(snapshots: Snapshot[]): Map<string, Snapshot>` — newest per `entryId` by `fetchedAt`
  - `lastActivity(snapshot: Snapshot | undefined): string | undefined` — max item timestamp of an `ok` snapshot
  - `daysBetween(fromIso: string, toIso: string): number` — fractional days, positive when `toIso` is later

- [ ] **Step 1: Write the failing tests**

`packages/core/test/signals/helpers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Snapshot } from '../../src/types.js';
import { daysBetween, lastActivity, latestSnapshots } from '../../src/signals/helpers.js';

function snap(entryId: string, fetchedAt: string, overrides: Partial<Snapshot> = {}): Snapshot {
  return { entryId, fetchedAt, status: 'ok', items: [], ...overrides };
}

describe('latestSnapshots', () => {
  it('keeps only the newest snapshot per entry', () => {
    const older = snap('a', '2026-07-01T00:00:00Z');
    const newer = snap('a', '2026-07-05T00:00:00Z');
    const other = snap('b', '2026-07-02T00:00:00Z');
    const latest = latestSnapshots([older, newer, other]);
    expect(latest.get('a')).toBe(newer);
    expect(latest.get('b')).toBe(other);
    expect(latest.size).toBe(2);
  });
});

describe('lastActivity', () => {
  it('returns the max item timestamp', () => {
    const snapshot = snap('a', '2026-07-05T00:00:00Z', {
      items: [
        { title: 'old', timestamp: '2026-06-01T00:00:00Z' },
        { title: 'new', timestamp: '2026-07-04T00:00:00Z' },
        { title: 'undated' },
      ],
    });
    expect(lastActivity(snapshot)).toBe('2026-07-04T00:00:00Z');
  });

  it('returns undefined for undefined, error, or activity-less snapshots', () => {
    expect(lastActivity(undefined)).toBeUndefined();
    expect(lastActivity(snap('a', '2026-07-05T00:00:00Z', { status: 'error' }))).toBeUndefined();
    expect(lastActivity(snap('a', '2026-07-05T00:00:00Z'))).toBeUndefined();
  });
});

describe('daysBetween', () => {
  it('computes fractional days', () => {
    expect(daysBetween('2026-07-01T00:00:00Z', '2026-07-08T12:00:00Z')).toBeCloseTo(7.5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @productiveme/core test helpers`
Expected: FAIL — cannot find module `../../src/signals/helpers.js`.

- [ ] **Step 3: Write the implementation**

`packages/core/src/signals/helpers.ts`:

```ts
import type { Snapshot } from '../types.js';

export function latestSnapshots(snapshots: Snapshot[]): Map<string, Snapshot> {
  const latest = new Map<string, Snapshot>();
  for (const snapshot of snapshots) {
    const current = latest.get(snapshot.entryId);
    if (!current || snapshot.fetchedAt > current.fetchedAt) {
      latest.set(snapshot.entryId, snapshot);
    }
  }
  return latest;
}

export function lastActivity(snapshot: Snapshot | undefined): string | undefined {
  if (!snapshot || snapshot.status !== 'ok') return undefined;
  let max: string | undefined;
  for (const item of snapshot.items) {
    if (item.timestamp && (!max || item.timestamp > max)) max = item.timestamp;
  }
  return max;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @productiveme/core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/signals packages/core/test/signals
git commit -m "feat(core): add snapshot helper functions"
```

---

### Task 6: review-due rule

**Files:**
- Create: `packages/core/src/signals/reviewDue.ts`
- Test: `packages/core/test/signals/reviewDue.test.ts`

**Interfaces:**
- Consumes: `latestSnapshots`, `lastActivity`, `daysBetween` (Task 5); `RegistryEntry`, `Snapshot`, `Signal`, `Cadence` (Task 3).
- Produces: `reviewDue(entries: RegistryEntry[], snapshots: Snapshot[], now: string): Signal[]` and `CADENCE_DAYS: Record<Cadence, number>` (weekly 7, monthly 31, quarterly 92).

- [ ] **Step 1: Write the failing tests**

`packages/core/test/signals/reviewDue.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '../../src/types.js';
import { reviewDue } from '../../src/signals/reviewDue.js';

const NOW = '2026-07-10T00:00:00Z';

const entry = (overrides: Partial<RegistryEntry>): RegistryEntry => ({
  id: 'finance-snapshot',
  name: 'Monthly asset snapshot',
  kind: 'tool',
  domain: 'finance',
  locator: 'file:///finance',
  connector: 'static-file',
  cadence: 'monthly',
  ...overrides,
});

const okSnap = (entryId: string, itemTs: string): Snapshot => ({
  entryId,
  fetchedAt: NOW,
  status: 'ok',
  items: [{ title: 'entry', timestamp: itemTs }],
});

describe('reviewDue', () => {
  it('emits a due signal when the cadence window has passed', () => {
    const signals = reviewDue([entry({})], [okSnap('finance-snapshot', '2026-05-01T00:00:00Z')], NOW);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ severity: 'due', domain: 'finance', entryId: 'finance-snapshot' });
    expect(signals[0]?.message).toContain('monthly');
  });

  it('emits nothing when activity is within the window', () => {
    const signals = reviewDue([entry({})], [okSnap('finance-snapshot', '2026-07-01T00:00:00Z')], NOW);
    expect(signals).toHaveLength(0);
  });

  it('treats never-touched cadenced entries as due', () => {
    expect(reviewDue([entry({})], [], NOW)).toHaveLength(1);
  });

  it('ignores entries without a cadence', () => {
    expect(reviewDue([entry({ cadence: undefined })], [], NOW)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @productiveme/core test reviewDue`
Expected: FAIL — cannot find module `../../src/signals/reviewDue.js`.

- [ ] **Step 3: Write the implementation**

`packages/core/src/signals/reviewDue.ts`:

```ts
import type { Cadence, RegistryEntry, Signal, Snapshot } from '../types.js';
import { daysBetween, lastActivity, latestSnapshots } from './helpers.js';

export const CADENCE_DAYS: Record<Cadence, number> = {
  weekly: 7,
  monthly: 31,
  quarterly: 92,
};

export function reviewDue(entries: RegistryEntry[], snapshots: Snapshot[], now: string): Signal[] {
  const latest = latestSnapshots(snapshots);
  const signals: Signal[] = [];
  for (const entry of entries) {
    if (!entry.cadence) continue;
    const activity = lastActivity(latest.get(entry.id));
    const overdue = !activity || daysBetween(activity, now) > CADENCE_DAYS[entry.cadence];
    if (overdue) {
      signals.push({
        severity: 'due',
        domain: entry.domain,
        entryId: entry.id,
        message: `"${entry.name}" is due for its ${entry.cadence} attention`,
        suggestedAction: `Review ${entry.name}`,
      });
    }
  }
  return signals;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @productiveme/core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/signals packages/core/test/signals
git commit -m "feat(core): add review-due signal rule"
```

---

### Task 7: connector-blocked rule

**Files:**
- Create: `packages/core/src/signals/connectorBlocked.ts`
- Test: `packages/core/test/signals/connectorBlocked.test.ts`

**Interfaces:**
- Consumes: `latestSnapshots` (Task 5); types (Task 3).
- Produces: `connectorBlocked(entries: RegistryEntry[], snapshots: Snapshot[]): Signal[]`.

- [ ] **Step 1: Write the failing tests**

`packages/core/test/signals/connectorBlocked.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '../../src/types.js';
import { connectorBlocked } from '../../src/signals/connectorBlocked.js';

const ENTRY: RegistryEntry = {
  id: 'career-repo',
  name: 'Portfolio repo',
  kind: 'repo',
  domain: 'career',
  locator: 'https://github.com/example/portfolio',
  connector: 'github',
};

describe('connectorBlocked', () => {
  it('emits a blocked signal for an error snapshot', () => {
    const errorSnap: Snapshot = {
      entryId: 'career-repo',
      fetchedAt: '2026-07-10T00:00:00Z',
      status: 'error',
      items: [],
      error: 'HTTP 401',
    };
    const signals = connectorBlocked([ENTRY], [errorSnap]);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ severity: 'blocked', domain: 'career', entryId: 'career-repo' });
    expect(signals[0]?.message).toContain('github');
    expect(signals[0]?.message).toContain('HTTP 401');
  });

  it('uses only the latest snapshot per entry (recovered connector emits nothing)', () => {
    const errorSnap: Snapshot = { entryId: 'career-repo', fetchedAt: '2026-07-09T00:00:00Z', status: 'error', items: [], error: 'HTTP 500' };
    const okSnap: Snapshot = { entryId: 'career-repo', fetchedAt: '2026-07-10T00:00:00Z', status: 'ok', items: [] };
    expect(connectorBlocked([ENTRY], [errorSnap, okSnap])).toHaveLength(0);
  });

  it('ignores snapshots for unknown entries', () => {
    const orphan: Snapshot = { entryId: 'ghost', fetchedAt: '2026-07-10T00:00:00Z', status: 'error', items: [] };
    expect(connectorBlocked([ENTRY], [orphan])).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @productiveme/core test connectorBlocked`
Expected: FAIL — cannot find module `../../src/signals/connectorBlocked.js`.

- [ ] **Step 3: Write the implementation**

`packages/core/src/signals/connectorBlocked.ts`:

```ts
import type { RegistryEntry, Signal, Snapshot } from '../types.js';
import { latestSnapshots } from './helpers.js';

export function connectorBlocked(entries: RegistryEntry[], snapshots: Snapshot[]): Signal[] {
  const latest = latestSnapshots(snapshots);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const signals: Signal[] = [];
  for (const [entryId, snapshot] of latest) {
    const entry = byId.get(entryId);
    if (!entry || snapshot.status !== 'error') continue;
    signals.push({
      severity: 'blocked',
      domain: entry.domain,
      entryId,
      message: `Connector "${entry.connector}" failed for "${entry.name}": ${snapshot.error ?? 'unknown error'}`,
      suggestedAction: `Check the ${entry.connector} connector`,
    });
  }
  return signals;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @productiveme/core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/signals packages/core/test/signals
git commit -m "feat(core): add connector-blocked signal rule"
```

---

### Task 8: domain-neglected rule

**Files:**
- Create: `packages/core/src/signals/domainNeglected.ts`
- Test: `packages/core/test/signals/domainNeglected.test.ts`

**Interfaces:**
- Consumes: `latestSnapshots`, `lastActivity`, `daysBetween` (Task 5); `DOMAIN_IDS` + types (Task 3).
- Produces: `domainNeglected(entries: RegistryEntry[], snapshots: Snapshot[], now: string, thresholdDays?: number): Signal[]` (default threshold 14).

- [ ] **Step 1: Write the failing tests**

`packages/core/test/signals/domainNeglected.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '../../src/types.js';
import { domainNeglected } from '../../src/signals/domainNeglected.js';

const NOW = '2026-07-10T00:00:00Z';

const entry = (id: string, domain: RegistryEntry['domain']): RegistryEntry => ({
  id,
  name: id,
  kind: 'project',
  domain,
  locator: `file:///${id}`,
  connector: 'static-file',
});

const snapWithActivity = (entryId: string, ts: string): Snapshot => ({
  entryId,
  fetchedAt: NOW,
  status: 'ok',
  items: [{ title: 'activity', timestamp: ts }],
});

describe('domainNeglected', () => {
  it('warns for a domain with no recent activity', () => {
    const signals = domainNeglected(
      [entry('life-exercise', 'life')],
      [snapWithActivity('life-exercise', '2026-06-01T00:00:00Z')],
      NOW,
    );
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ severity: 'warning', domain: 'life' });
  });

  it('stays quiet for a domain with recent activity', () => {
    const signals = domainNeglected(
      [entry('life-exercise', 'life')],
      [snapWithActivity('life-exercise', '2026-07-08T00:00:00Z')],
      NOW,
    );
    expect(signals).toHaveLength(0);
  });

  it('warns for a domain whose entries have no activity at all', () => {
    const signals = domainNeglected([entry('life-exercise', 'life')], [], NOW);
    expect(signals).toHaveLength(1);
  });

  it('skips domains with no registry entries', () => {
    const signals = domainNeglected([entry('life-exercise', 'life')], [], NOW);
    expect(signals.every((signal) => signal.domain === 'life')).toBe(true);
  });

  it('respects a custom threshold', () => {
    const signals = domainNeglected(
      [entry('life-exercise', 'life')],
      [snapWithActivity('life-exercise', '2026-07-08T00:00:00Z')],
      NOW,
      1,
    );
    expect(signals).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @productiveme/core test domainNeglected`
Expected: FAIL — cannot find module `../../src/signals/domainNeglected.js`.

- [ ] **Step 3: Write the implementation**

`packages/core/src/signals/domainNeglected.ts`:

```ts
import { DOMAIN_IDS, type RegistryEntry, type Signal, type Snapshot } from '../types.js';
import { daysBetween, lastActivity, latestSnapshots } from './helpers.js';

export function domainNeglected(
  entries: RegistryEntry[],
  snapshots: Snapshot[],
  now: string,
  thresholdDays = 14,
): Signal[] {
  const latest = latestSnapshots(snapshots);
  const signals: Signal[] = [];
  for (const domain of DOMAIN_IDS) {
    const domainEntries = entries.filter((entry) => entry.domain === domain);
    if (domainEntries.length === 0) continue;
    let newest: string | undefined;
    for (const entry of domainEntries) {
      const activity = lastActivity(latest.get(entry.id));
      if (activity && (!newest || activity > newest)) newest = activity;
    }
    if (!newest || daysBetween(newest, now) > thresholdDays) {
      signals.push({
        severity: 'warning',
        domain,
        message: `No activity in ${domain} for over ${thresholdDays} days`,
        suggestedAction: `Pick one small ${domain} action this week`,
      });
    }
  }
  return signals;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @productiveme/core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/signals packages/core/test/signals
git commit -m "feat(core): add domain-neglected signal rule"
```

---

### Task 9: career-life-imbalance rule

**Files:**
- Create: `packages/core/src/signals/careerLifeImbalance.ts`
- Test: `packages/core/test/signals/careerLifeImbalance.test.ts`

**Interfaces:**
- Consumes: `latestSnapshots`, `daysBetween` (Task 5); types (Task 3).
- Produces: `careerLifeImbalance(entries: RegistryEntry[], snapshots: Snapshot[], now: string, options?: { windowDays?: number; ratio?: number; minCareerItems?: number }): Signal[]` (defaults: 14 / 3 / 5).

- [ ] **Step 1: Write the failing tests**

`packages/core/test/signals/careerLifeImbalance.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot, SnapshotItem } from '../../src/types.js';
import { careerLifeImbalance } from '../../src/signals/careerLifeImbalance.js';

const NOW = '2026-07-10T00:00:00Z';
const RECENT = '2026-07-05T00:00:00Z';
const OLD = '2026-05-01T00:00:00Z';

const entry = (id: string, domain: RegistryEntry['domain']): RegistryEntry => ({
  id, name: id, kind: 'project', domain, locator: `file:///${id}`, connector: 'static-file',
});

const items = (count: number, ts: string): SnapshotItem[] =>
  Array.from({ length: count }, (_, i) => ({ title: `item-${i}`, timestamp: ts }));

const snap = (entryId: string, snapItems: SnapshotItem[]): Snapshot => ({
  entryId, fetchedAt: NOW, status: 'ok', items: snapItems,
});

describe('careerLifeImbalance', () => {
  it('warns when career activity dwarfs life activity', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(9, RECENT)), snap('l', items(2, RECENT))],
      NOW,
    );
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ severity: 'warning', domain: 'life' });
    expect(signals[0]?.message).toContain('9');
    expect(signals[0]?.message).toContain('2');
  });

  it('warns when life activity is zero but career is active', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(5, RECENT))],
      NOW,
    );
    expect(signals).toHaveLength(1);
  });

  it('stays quiet under the minimum career volume', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(4, RECENT))],
      NOW,
    );
    expect(signals).toHaveLength(0);
  });

  it('stays quiet when the ratio is healthy', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(6, RECENT)), snap('l', items(4, RECENT))],
      NOW,
    );
    expect(signals).toHaveLength(0);
  });

  it('ignores items outside the window', () => {
    const signals = careerLifeImbalance(
      [entry('c', 'career'), entry('l', 'life')],
      [snap('c', items(9, OLD))],
      NOW,
    );
    expect(signals).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @productiveme/core test careerLifeImbalance`
Expected: FAIL — cannot find module `../../src/signals/careerLifeImbalance.js`.

- [ ] **Step 3: Write the implementation**

`packages/core/src/signals/careerLifeImbalance.ts`:

```ts
import type { RegistryEntry, Signal, Snapshot } from '../types.js';
import { daysBetween, latestSnapshots } from './helpers.js';

export interface ImbalanceOptions {
  windowDays?: number;
  ratio?: number;
  minCareerItems?: number;
}

export function careerLifeImbalance(
  entries: RegistryEntry[],
  snapshots: Snapshot[],
  now: string,
  { windowDays = 14, ratio = 3, minCareerItems = 5 }: ImbalanceOptions = {},
): Signal[] {
  const latest = latestSnapshots(snapshots);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  let career = 0;
  let life = 0;
  for (const [entryId, snapshot] of latest) {
    const entry = byId.get(entryId);
    if (!entry || snapshot.status !== 'ok') continue;
    if (entry.domain !== 'career' && entry.domain !== 'life') continue;
    for (const item of snapshot.items) {
      if (!item.timestamp || daysBetween(item.timestamp, now) > windowDays) continue;
      if (entry.domain === 'career') career += 1;
      else life += 1;
    }
  }
  const imbalanced = career >= minCareerItems && (life === 0 || career / life >= ratio);
  if (!imbalanced) return [];
  return [
    {
      severity: 'warning',
      domain: 'life',
      message: `Career activity (${career} items) is far outpacing Life (${life}) over the last ${windowDays} days`,
      suggestedAction: 'Protect one Life activity this week',
    },
  ];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @productiveme/core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/signals packages/core/test/signals
git commit -m "feat(core): add career-life-imbalance signal rule"
```

---

### Task 10: computeSignals aggregator + public API

**Files:**
- Create: `packages/core/src/signals/index.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/signals/computeSignals.test.ts`

**Interfaces:**
- Consumes: all four rules (Tasks 6–9).
- Produces: `computeSignals(entries: RegistryEntry[], snapshots: Snapshot[], now: string): Signal[]` — ordered blocked → due → warnings; the package's public surface re-exports everything (`types`, `registry`, `signals`).

- [ ] **Step 1: Write the failing tests**

`packages/core/test/signals/computeSignals.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { RegistryEntry, Snapshot } from '../../src/types.js';
import { computeSignals } from '../../src/signals/index.js';

const NOW = '2026-07-10T00:00:00Z';

const ENTRIES: RegistryEntry[] = [
  {
    id: 'finance-snapshot',
    name: 'Monthly asset snapshot',
    kind: 'tool',
    domain: 'finance',
    locator: 'file:///finance',
    connector: 'static-file',
    cadence: 'monthly',
  },
  {
    id: 'career-repo',
    name: 'Portfolio repo',
    kind: 'repo',
    domain: 'career',
    locator: 'https://github.com/example/portfolio',
    connector: 'github',
  },
];

const SNAPSHOTS: Snapshot[] = [
  { entryId: 'career-repo', fetchedAt: NOW, status: 'error', items: [], error: 'HTTP 401' },
];

describe('computeSignals', () => {
  it('aggregates all rules with blocked signals first', () => {
    const signals = computeSignals(ENTRIES, SNAPSHOTS, NOW);
    const severities = signals.map((signal) => signal.severity);
    expect(severities[0]).toBe('blocked'); // github connector down
    expect(severities).toContain('due'); // finance snapshot never touched
    expect(severities).toContain('warning'); // both domains inactive
  });

  it('returns an empty array for an empty registry', () => {
    expect(computeSignals([], [], NOW)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @productiveme/core test computeSignals`
Expected: FAIL — cannot find module `../../src/signals/index.js`.

- [ ] **Step 3: Write the implementation**

`packages/core/src/signals/index.ts`:

```ts
import type { RegistryEntry, Signal, Snapshot } from '../types.js';
import { careerLifeImbalance } from './careerLifeImbalance.js';
import { connectorBlocked } from './connectorBlocked.js';
import { domainNeglected } from './domainNeglected.js';
import { reviewDue } from './reviewDue.js';

export * from './careerLifeImbalance.js';
export * from './connectorBlocked.js';
export * from './domainNeglected.js';
export * from './helpers.js';
export * from './reviewDue.js';

export function computeSignals(entries: RegistryEntry[], snapshots: Snapshot[], now: string): Signal[] {
  return [
    ...connectorBlocked(entries, snapshots),
    ...reviewDue(entries, snapshots, now),
    ...domainNeglected(entries, snapshots, now),
    ...careerLifeImbalance(entries, snapshots, now),
  ];
}
```

Replace `packages/core/src/index.ts` content with:

```ts
export * from './registry.js';
export * from './signals/index.js';
export * from './types.js';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @productiveme/core test` and `pnpm typecheck` and `pnpm lint`
Expected: all PASS / exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src packages/core/test
git commit -m "feat(core): add computeSignals aggregator and public API"
```

---

### Task 11: Sample registry + end-to-end validation test

**Files:**
- Create: `registry.yaml` (repo root)
- Test: `packages/core/test/registry-file.test.ts`

**Interfaces:**
- Consumes: `parseRegistry` (Task 4).
- Produces: the repo's actual `registry.yaml`, guaranteed-parseable by CI. (Placeholder entries — the owner replaces locators with real repos/Notion pages later; the test keeps them honest.)

- [ ] **Step 1: Write the failing test**

`packages/core/test/registry-file.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DOMAIN_IDS, parseRegistry } from '../src/index.js';

// The test (not core src) may touch the filesystem: it validates the repo's
// real registry file so CI fails when a hand-edit breaks it.
const REGISTRY_PATH = fileURLToPath(new URL('../../../registry.yaml', import.meta.url));

describe('repo registry.yaml', () => {
  it('parses and covers all four domains', () => {
    const entries = parseRegistry(readFileSync(REGISTRY_PATH, 'utf8'));
    expect(entries.length).toBeGreaterThanOrEqual(4);
    const domains = new Set(entries.map((entry) => entry.domain));
    for (const domain of DOMAIN_IDS) expect(domains.has(domain)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @productiveme/core test registry-file`
Expected: FAIL — ENOENT, `registry.yaml` does not exist.

- [ ] **Step 3: Create the sample registry**

`registry.yaml` (repo root):

```yaml
# ProductiveME registry — what the control plane knows about.
# Placeholder locators: replace with real repos/pages/folders as they connect.
entries:
  - id: career-portfolio-repo
    name: Portfolio repo
    kind: repo
    domain: career
    subdomain: dream
    locator: https://github.com/placeholder/portfolio
    connector: static-file

  - id: career-study-notes
    name: Study notes
    kind: notion-page
    domain: career
    subdomain: study
    locator: https://www.notion.so/placeholder-study
    connector: static-file
    cadence: weekly

  - id: finance-monthly-snapshot
    name: Monthly asset snapshot
    kind: tool
    domain: finance
    subdomain: assets
    locator: file:///placeholder/finance
    connector: static-file
    cadence: monthly

  - id: personal-data-photos
    name: Photo library
    kind: folder
    domain: personal-data
    subdomain: photos
    locator: file:///placeholder/photos
    connector: local-folder
    cadence: quarterly

  - id: life-exercise-log
    name: Exercise log
    kind: notion-page
    domain: life
    subdomain: exercise
    locator: https://www.notion.so/placeholder-exercise
    connector: static-file
    cadence: weekly
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS, all suites.

- [ ] **Step 5: Commit**

```bash
git add registry.yaml packages/core/test/registry-file.test.ts
git commit -m "feat: add sample registry validated end-to-end by CI"
```

---

## Completion Checklist (Phase 0–1 success criteria from the spec)

- `pnpm lint && pnpm typecheck && pnpm test` all green from a clean checkout.
- CI workflow runs the same three gates on every PR and push to main.
- ADR-0001 committed under `docs/adr/`.
- All four signal rules unit-tested with fixed `now` values.
- Invalid registry input fails with a path-bearing error message.
- `registry.yaml` parses and covers all four domains.
