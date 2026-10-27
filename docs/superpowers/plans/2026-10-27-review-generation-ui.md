# Review Generation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and display weekly or monthly review drafts through the existing API.

**Architecture:** The web API client posts only the selected period to `/reviews`, validates the response, and maps known error codes. The Review component uses a mutation, renders plain text, and keeps generation state local to the view.

**Tech Stack:** TypeScript, React, TanStack Query, Vitest, Fastify API contract.

**Spec:** `docs/superpowers/specs/2026-10-27-review-generation-ui-design.md`

## Global Constraints

- Draft generation stays disabled until inference settings are configured.
- Do not persist drafts or expose upstream error text.
- Do not install Ollama or pull model weights as part of implementation.

## Review Focus

- API configured with an unrecognized error code: show generic safe recovery guidance.
- API connection failure: show generic connection guidance without raw exception text.
- Malformed successful response: reject instead of displaying a partial draft.
- Period switch during generation: prevent switching until the request settles.
- Draft containing HTML: display as text and never interpret it as markup.

---

### Task 1: Typed review client

**Files:**
- Modify: `packages/api-client/src/index.ts`
- Test: `apps/web/src/lib/api-client.test.ts`

**Interfaces:**
- Produces: `createReview(period)` returning the generated OpenAPI response and `ReviewApiError` with a constrained error code.

- [x] Write tests for POST body, `/api` prefix preservation, and safe known/unknown/network errors.
- [x] Run focused tests and confirm the missing method fails.
- [x] Implement the typed client operation and response validation.
- [x] Run the focused client test.

### Task 2: Review generation interface

**Files:**
- Modify: `apps/web/src/components/Review.tsx`
- Test: `apps/web/src/components/Review.test.tsx`
- Modify: `apps/web/src/App.test.tsx`

- [x] Write tests for generated draft, pending guard, safe failure, and plain-text rendering.
- [x] Run the UI tests and confirm the requested controls are missing.
- [x] Connect mutation state and remove prototype review values.
- [x] Run the Review and App tests.

### Task 3: Setup notes

**Files:**
- Modify: `README.md`
- Create: `docs/superpowers/specs/2026-10-27-review-generation-ui-design.md`
- Create: `docs/superpowers/plans/2026-10-27-review-generation-ui.md`

- [x] Document the candidate model, manual Ollama setup, private networking, and measured comparison procedure.
- [x] Verify the documented commands and environment variable names against the API and Compose configuration.
