# Phase 3 — Web UI (`apps/web`): ProductiveME Prototype

- Status: accepted
- Date: 2026-07-17
- Branch: `feat/phase3-web` (off `main`, PR #1 merged)
- Source of truth: the live Claude Design file `ProductiveME Prototype.dc.html`
  (project `87aee349-30b5-49dc-9b69-e847d023298b`), pulled via the design MCP.
  The local `untitled/` copy was stale and must not be used.

## Context

Phase 3 of the roadmap is the web frontend. The design was mocked in Claude
Design and exported as an HTML/CSS/JS prototype. This spec recreates that
prototype faithfully as a real React app inside the existing TypeScript
monorepo. It is a **static, faithful first pass** — no backend wiring.

The live design differs from the earlier local export in ways that matter:
top nav is **Home · Review · MCP** (Domains is opened from Home cards, not a
nav item); Review has a working **Weekly ⇄ Monthly** toggle with a computed
**monthly calendar heatmap**; Home domain cards are clickable; dark-theme
line/tint tokens are stronger.

## Decisions

1. **New workspace package `@productiveme/web`** — React + Vite + TypeScript,
   under `apps/*` (already declared in `pnpm-workspace.yaml`). Node 22, ESM,
   strict TS + `noUncheckedIndexedAccess`, Vitest + Testing Library — matching
   `packages/core` conventions.
2. **Base branch:** `feat/phase3-web` off `main` (PR #1 already merged).
3. **Data:** static, typed mock data in `src/data/mock.ts`, holding the exact
   numbers and copy from the live design. Structured per domain so a later
   phase can swap in `packages/core` / the API. **No** core wiring now.
4. **ADR-0001 compliance ("TypeScript everywhere"):** all application code is
   TypeScript. Design tokens live in a **`.ts` module** injected as a `<style>`
   at startup (as the prototype itself does). `index.html` — the Vite entry —
   is the only non-`.ts` file, unavoidable for any Vite/React app. ADR-0001
   governs the *programming language* (no Python/Java/polyglot); HTML/CSS are
   the web platform's markup/styling, not a second language, and the ADR
   explicitly lists a "React frontend" as part of the platform.
5. **Styling:** inline styles ported near-verbatim from the prototype, over CSS
   Modules — minimizes pixel drift on a faithful port. Only genuinely repeated
   patterns are extracted into small shared components.
6. **Faithful inertness:** buttons with no handler in the source (Save review,
   Export to Notion, Publish, Record now, Protect block, + add MCP server,
   Regenerate, Edit) remain static no-ops. No invented behavior.

## State model (mirrors the prototype)

Four pieces of local UI state, no router, no persistence:

| state        | values                                   | default   |
|--------------|------------------------------------------|-----------|
| `tab`        | `home` \| `review` \| `domain` \| `mcp`  | `home`    |
| `domain`     | `career` \| `finance` \| `pdata` \| `life` | `finance` |
| `reviewMode` | `weekly` \| `monthly`                    | `weekly`  |
| `theme`      | `dark` \| `light`                        | `dark`    |

`theme` sets a `data-theme` attribute on the app root; tokens resolve from CSS
variables. Working interactions: tab nav (Home/Review/MCP), domain sub-tabs,
Home domain-cards → open that domain, Home CTA → Domains, "Start weekly
review" → Review, Weekly⇄Monthly toggle, theme toggle.

## Architecture

```
apps/web/
  index.html              # font <link>s + <div id="root"> + module script (only non-.ts file)
  package.json  tsconfig.json  vite.config.ts
  src/
    main.tsx              # mount, inject tokens
    App.tsx               # tab/domain/reviewMode/theme state + TopBar + view switch
    styles/tokens.ts      # design-token CSS as a string, injected as <style>; base body/.mono/.hf
    types.ts              # types for mock data + state unions
    data/mock.ts          # static data — exact numbers/copy from the live design
    lib/calendar.ts       # pure buildCalendar() — ports the monthly-heatmap logic
    components/
      TopBar.tsx
      Home.tsx  Review.tsx  Domains.tsx  Mcp.tsx
      bits.tsx            # shared: ProgressBar, StatCell, DomainStatusCard, Donut, Pill
```

Each unit has one purpose: `App` owns state and routing-by-state; each view is a
pure function of its props + mock data; `bits.tsx` holds reusable primitives;
`lib/calendar.ts` is pure and independently testable; `data/mock.ts` is the
single place real data will later replace mock data.

## The one piece of real logic — monthly heatmap

`buildCalendar()` in `lib/calendar.ts` ports the prototype's `reviewVals`
computation as a pure function returning typed cell descriptors:

- 3 leading blank (hidden) cells, then days 1–31.
- Per-day `score` from a fixed map (days 1–17); day 17 = **today** (accent
  border/glow, accent number); days > 17 = **future** (dimmed, no score).
- Each day renders 3 score segments; a segment is "active" when `score >
  segmentIndex`, using the score's fill colour with a glow, else a faint track.

Rendering consumes the descriptors; no styling logic leaks into the view.

## Testing (Vitest + Testing Library + jsdom)

- Each of the four views renders when navigated to.
- Theme toggle flips `data-theme` between `dark` and `light`.
- Clicking a Home domain card lands on the matching domain in the Domains view.
- Weekly/Monthly toggle switches Review content.
- `buildCalendar()`: 34 cells (3 blank + 31), day 17 flagged today, days 18–31
  flagged future (no score), segment active/inactive logic correct.

Success: `pnpm --filter @productiveme/web typecheck` and `test` green; `pnpm lint`
clean; `pnpm --filter @productiveme/web dev` renders all four views in both themes.

## Out of scope

Wiring to `packages/core`; API/sync layers; the *Wireframes* and *Home Themes*
design files; routing; persistence; any invented button behavior.
