# Local Inference Foundation Plan

**Goal:** Provide an opt-in, bounded Ollama-backed review draft endpoint and
revise ProductiveME's roadmap for Wyse-first local deployment.

**Implementation:** Validate inference environment settings, build a short
server-grounded weekly/monthly prompt from local snapshots/signals, make one
non-streaming Ollama request with timeout and in-process concurrency limit,
then expose a constrained Fastify route. Update the umbrella platform design,
ADR, Compose environment passthrough, and operator docs.

1. Add tests for disabled config, validated limits, request payload and safe
   failure behavior; confirm they fail before implementing.
2. Implement config and inference adapter; run focused API tests/typecheck.
3. Add route tests for fixed-clock ranges, grounded context, invalid input,
   availability and concurrency; then wire the route/OpenAPI.
4. Update the roadmap, focused plan/design, ADR, Compose and README.
5. Run API and repository checks, regenerate the typed client if needed, inspect
   the diff, and commit only scoped files.

**Success:** API starts and all existing read routes remain available when
inference is unconfigured; configured draft requests use server-owned facts,
return safe bounded drafts, and never leak upstream details.
