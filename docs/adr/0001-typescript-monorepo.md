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
