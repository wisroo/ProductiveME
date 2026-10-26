# Phase 5 Local Container and Operations Implementation Plan

> **For agentic workers:** Native implementation in the current session; tasks are sequential because the smoke path consumes both images.

**Goal:** Build and exercise API and one-shot Sync containers with safe local defaults, structured logs, health, and shutdown behavior.

**Architecture:** Pinned Node workspace images install frozen, production-only app dependencies and run as a non-root user. Compose shares snapshots with writable access only for Sync and exposes the API on loopback; a fixture-only smoke script exercises the assembled topology.

**Tech Stack:** Node 24.22.1, pnpm 10.12.1, Fastify/Pino, Docker Compose, Vitest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-27-phase5-container-ops-design.md`

## Global Constraints

- Keep secrets out of Docker build args and image layers.
- Exclude `.git`, `.claude`, `.codex`, `.aws`, `node_modules`, local snapshots, and environment files from build context.
- Use only temporary fixture data in Docker smoke tests.
- Do not provision AWS or register a scheduler in this unit.

## Review Focus

- Invalid host/port environment values fail startup with clear messages.
- Request logs omit authorization, cookies, query strings, and locator details.
- Sync's completion record reports counts without entry locators or credentials.
- Sync can create the shared volume contents under its runtime UID; API reads them read-only.
- Smoke cleanup removes only resources named by its unique Compose project.

---

### Task 1: Runtime behavior

**Files:** `apps/api/src/app.ts`, `apps/api/src/main.ts`, `apps/api/test/read-api.test.ts`, `apps/api/test/runtime.test.ts`, `apps/sync/src/main.ts`, `apps/sync/test/cli.test.ts`

- [x] Add failing tests for liveness, runtime config, redaction/outcome logs, and shutdown.
- [x] Implement the minimum runtime behavior to pass.
- [x] Run focused API and Sync tests.

### Task 2: Container and Compose topology

**Files:** root `Dockerfile.api`, `Dockerfile.sync`, `compose.yaml`, `.dockerignore`, `scripts/docker-smoke.sh`

- [x] Add a fixture-only smoke script for the assembled topology.
- [x] Add reproducible images and Compose mounts/user/ports.
- [x] Run Docker builds and smoke script.

### Task 3: CI and operator documentation

**Files:** `.github/workflows/ci.yml`, `README.md`, this design and plan

- [x] Add the Docker smoke CI job.
- [x] Document local Compose usage, configuration, and deferred AWS work.
- [x] Run repository checks, smoke, and diff review.
