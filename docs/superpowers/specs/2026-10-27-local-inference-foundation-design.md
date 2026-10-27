# Local Inference Foundation Design

- **Date**: 2026-10-27
- **Status**: Approved for implementation by the task handoff
- **Approach**: Keep inference behind an opt-in API setting and adapt Ollama's
  non-streaming `/api/generate` contract. This gives the Wyse 5060 a small,
  measurable first deployment while allowing the inference process to live on
  another private-network host. A provider-neutral public interface with many
  adapters is deferred until there is a second real provider.

## Intent

Revise the roadmap so the personal Wyse 5060 (AMD quad-core, 8 GB RAM,
64 GB storage) is the first target. AWS remains optional learning work, not a
prerequisite. Establish one safe, bounded local inference path for review
drafts. The API remains usable offline with inference disabled.

## Scope and constraints

- Add an opt-in `POST /reviews` draft route, using server-loaded registry,
  latest snapshots, and computed signals. Accept only weekly/monthly period;
  derive ranges from the injected clock.
- The caller cannot supply prompts, models, endpoints, snapshots, or source
  data. Do not send registry locators or files; include only short, bounded
  facts from snapshots and signals.
- Configure Ollama base URL, model, timeout, context window, and output cap
  through validated environment settings. Defaults are disabled, 2048 context,
  and at most 512 output tokens. No daemon, model download, or network service
  is started by Compose unless the operator configures an endpoint.
- Configured context must leave at least 512 tokens beyond the output cap.
  Prompt text has its own character limit, which bounds payload size but does
  not claim an exact tokenizer count. Requests set Ollama `think: false`, so
  select a model that supports disabling thinking.
- Make one non-streaming request at a time per API process; concurrent requests
  receive a safe busy response. Bound prompt and output sizes, abort on timeout,
  validate upstream response shape, and do not expose upstream error bodies,
  prompts, or endpoint URLs in API errors/logs.
- Keep the first slice as a generated draft only. Persistence, finalization,
  UI, source opt-in controls, quality evaluation, and AWS deployment remain
  later work.

## Verification

Use fake fetch responses for request contract, bounds, timeout, invalid
responses, busy/release behavior, disabled configuration, fixed-clock periods,
and the real route contract. No model pulls or hardware access are needed.
