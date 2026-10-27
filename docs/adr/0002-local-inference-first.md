# ADR-0002: Local inference first

- **Status**: Accepted
- **Date**: 2026-10-27

## Context

ProductiveME is a personal system and its first server is a Wyse 5060 with an
AMD quad-core CPU, 8 GB RAM, and 64 GB storage. Cloud deployment is useful for
learning but is not required to validate the product. Review generation must
remain useful without inference and should not send source files or registry
locators to a model.

## Decision

Treat the Wyse as the first host and make AWS an optional later exercise. Start
with one small quantized local model served by Ollama. The API uses an
environment-configured Ollama endpoint and model, so the inference server may
run on the Wyse or another host reachable on the private network without
changing API or web code. Keep inference disabled by default. Generate short
weekly/monthly drafts from bounded server-side snapshot facts and computed
signals, with fixed-clock period calculation, a single in-flight generation,
timeouts, and strict request/response bounds.

Quality, latency, and memory must be measured on the actual selected model and
host before choosing a permanent model. The first slice returns a draft only;
storage and editing/finalization follow after evaluation.

## Alternatives

- **AWS-hosted model first:** useful cloud practice, but requires cloud setup
  and sends personal context off-device before local quality is understood.
- **Hard-code an inference process into Compose:** convenient for a demo, but
  couples API deployment to model downloads and resource requirements.
- **Multiple provider adapters immediately:** broadens design without a second
  provider requirement. Revisit when a concrete alternative is selected.

## Consequences

- Compose exposes environment passthrough only; it does not install Ollama or
  download model weights.
- Operator configures a private-network Ollama endpoint and measures quality,
  latency, and memory on the actual hardware.
- Existing read API and offline behavior remain independent of inference.
- Persistence, UI, source-data opt-in, and AWS work remain explicit roadmap
  follow-ups.
