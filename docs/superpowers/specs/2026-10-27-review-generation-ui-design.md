# Review Generation UI Design

- **Date**: 2026-10-27
- **Status**: Approved for implementation by task handoff
- **Approach**: Add an explicit weekly/monthly generate action backed by the
  existing typed `POST /reviews` API, and render its response as plain text.

## Intent

Let a person request and read a server-grounded review draft in the existing
Review view, while keeping local inference opt-in and leaving drafts unsaved.

## Goals and constraints

- Send only the selected `weekly` or `monthly` period; the server owns context,
  date ranges, and generation.
- Show the returned date range and draft as escaped plain text.
- Prevent concurrent clicks and period changes during one generation request.
- Preserve an existing draft if regeneration fails; never retry automatically.
- Map only known API error codes to safe, actionable guidance.
- Leave persistence, editing, and export unavailable and labeled accordingly.
- Remove prototype review numbers and narratives so they cannot be mistaken for
  live data.
- Keep Ollama disabled by default and outside the Compose service graph.

## Approaches

- **Use the existing endpoint and API client** (chosen): smallest path, preserves
  server-side data boundaries, and adds no provider logic to the browser.
- **Call Ollama directly from the browser**: rejected because it exposes the
  inference host and bypasses the API's bounded server-generated context.
- **Persist drafts as part of generation**: deferred because the API currently
  returns drafts only and has no save contract.

## Remaining implementation choices

Use TanStack Query's mutation state for pending/error behavior; keep the last
successful draft in component state and show it only for its matching period.
Document `qwen3:0.6b` Q4 as the first smoke model and `qwen3:1.7b` Q4 as a
quality comparison, then choose permanently only after measuring the target host.
