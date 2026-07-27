# Phase 3 Web Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first executable `apps/web` slice: a React/Vite package with the ProductiveME shell, Home/Review/MCP navigation, and dark/light theme state.

**Architecture:** `App` owns the small local state machine and renders a dedicated `TopBar`. Design tokens remain a TypeScript string injected by `main.tsx`, preserving the accepted spec's TypeScript-everywhere boundary while leaving detailed view components for later independently testable slices.

**Tech Stack:** Node 22+, pnpm 10.12.1, React 19, Vite 7, TypeScript 5, Vitest 3, Testing Library, jsdom.

## Global Constraints

- Package name is `@productiveme/web` under `apps/web`.
- Application code is TypeScript; `index.html` is the only non-TypeScript application file.
- Use local React state only; no router, persistence, backend, or `packages/core` wiring.
- Top navigation is exactly Home, Review, MCP.
- Theme values are exactly `dark` and `light`, defaulting to `dark`.
- Styling uses a `.ts` token module injected at startup; do not add Tailwind or CSS Modules.
- Buttons outside the specified tab and theme interactions remain inert.

---

### Task 1: Executable web package and tested application shell

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/App.test.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/components/TopBar.tsx`
- Create: `apps/web/src/styles/tokens.ts`
- Create: `apps/web/src/main.tsx`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `type PrimaryTab = 'home' | 'review' | 'mcp'`
- Produces: `type Theme = 'dark' | 'light'`
- Produces: `TopBar({ activeTab, theme, onTabChange, onThemeToggle })`
- Produces: default-exported `App()` rendering a root element with `data-theme`

- [x] **Step 1: Add package and test-runner configuration**

Create the package metadata and TypeScript/Vite configuration:

```json
{
  "name": "@productiveme/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^7.0.0",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.2.0",
    "jsdom": "^29.1.1",
    "vite": "^7.3.6",
    "vitest": "^3.2.7"
  }
}
```

Configure `tsconfig.json` with `moduleResolution: "Bundler"`, `jsx: "react-jsx"`, DOM libs, and strict settings inherited from `../../tsconfig.base.json`. Configure `vite.config.ts` with the React plugin and jsdom test environment, loading `src/test/setup.ts`.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true
  },
  "include": ["src", "vite.config.ts"]
}
```

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

Create `index.html` with an `#root` mount, Outfit and JetBrains Mono font links, and `/src/main.tsx` as the module entry. Create the test setup with:

```ts
import '@testing-library/jest-dom/vitest';
```

- [x] **Step 2: Install the workspace package**

Run:

```bash
PATH="/Users/a11791/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm install
```

Expected: exit 0, `apps/web` importer added to `pnpm-lock.yaml`.

- [x] **Step 3: Write the failing interaction tests**

Create `src/App.test.tsx` with three real-behavior tests:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.js';

describe('App shell', () => {
  it('renders Home by default and switches primary views', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Today, at a glance' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Review' }));
    expect(screen.getByRole('heading', { name: 'Review your trajectory' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'MCP' }));
    expect(screen.getByRole('heading', { name: 'MCP connections' })).toBeInTheDocument();
  });

  it('marks only the active primary tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    const home = screen.getByRole('button', { name: 'Home' });
    const review = screen.getByRole('button', { name: 'Review' });

    expect(home).toHaveAttribute('aria-pressed', 'true');
    expect(review).toHaveAttribute('aria-pressed', 'false');

    await user.click(review);
    expect(home).toHaveAttribute('aria-pressed', 'false');
    expect(review).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles the root theme between dark and light', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const root = container.firstElementChild;

    expect(root).toHaveAttribute('data-theme', 'dark');
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(root).toHaveAttribute('data-theme', 'light');
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
  });
});
```

These tests catch missing state transitions, incorrect active-tab state, and a theme toggle that updates only its label rather than the app root.

- [x] **Step 4: Run the focused test and verify RED**

Run:

```bash
PATH="/Users/a11791/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm --filter @productiveme/web test
```

Expected: FAIL because `src/App.tsx` does not exist.

- [x] **Step 5: Implement the minimal application shell**

Create `App.tsx` with local `tab` and `theme` state, render `TopBar`, and map the three tabs to the exact tested headings. Create `TopBar.tsx` with three `aria-pressed` navigation buttons and a theme button whose accessible label describes the target theme.

```tsx
import { useState } from 'react';
import TopBar from './components/TopBar.js';

export type PrimaryTab = 'home' | 'review' | 'mcp';
export type Theme = 'dark' | 'light';

const views = {
  home: {
    eyebrow: 'Personal operating system',
    heading: 'Today, at a glance',
    description: 'A focused read on the four domains shaping your week.',
  },
  review: {
    eyebrow: 'Weekly review',
    heading: 'Review your trajectory',
    description: 'Turn recent signals into one deliberate adjustment.',
  },
  mcp: {
    eyebrow: 'Connected context',
    heading: 'MCP connections',
    description: 'See which systems can contribute trusted context.',
  },
} as const;

export default function App() {
  const [tab, setTab] = useState<PrimaryTab>('home');
  const [theme, setTheme] = useState<Theme>('dark');
  const view = views[tab];

  return (
    <div className="app-shell" data-theme={theme}>
      <TopBar
        activeTab={tab}
        theme={theme}
        onTabChange={setTab}
        onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      />
      <main className="workspace" id="main-content">
        <p className="eyebrow">{view.eyebrow}</p>
        <h1>{view.heading}</h1>
        <p className="lede">{view.description}</p>
        <section className="foundation-panel" aria-label={`${view.heading} preview`}>
          <span>Phase 3 foundation</span>
          <p>The detailed {tab} view arrives as its own tested roadmap slice.</p>
        </section>
      </main>
      <footer className="status-line">
        <span>Local prototype</span>
        <span>Static data</span>
      </footer>
    </div>
  );
}
```

```tsx
import type { PrimaryTab, Theme } from '../App.js';

type TopBarProps = {
  activeTab: PrimaryTab;
  theme: Theme;
  onTabChange: (tab: PrimaryTab) => void;
  onThemeToggle: () => void;
};

const tabs: ReadonlyArray<{ id: PrimaryTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'review', label: 'Review' },
  { id: 'mcp', label: 'MCP' },
];

export default function TopBar({
  activeTab,
  theme,
  onTabChange,
  onThemeToggle,
}: TopBarProps) {
  const targetTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="topbar">
      <a className="brand" href="#main-content" aria-label="ProductiveME home">
        <span className="brand-mark" aria-hidden="true" />
        <span>ProductiveME</span>
      </a>
      <nav className="primary-nav" aria-label="Primary">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <button
        className="theme-toggle"
        type="button"
        aria-label={`Switch to ${targetTheme} theme`}
        onClick={onThemeToggle}
      >
        {targetTheme}
      </button>
    </header>
  );
}
```

Create `styles/tokens.ts` exporting a single CSS string with dark/light variables, an off-black dark background, warm neutral surfaces, one muted orange accent, responsive shell spacing, visible focus styles, and transform-only hover/active transitions. Create `main.tsx` to inject the CSS string once and mount `<App />`.

```ts
const tokens = `
:root {
  font-family: 'Outfit', system-ui, sans-serif;
  color-scheme: dark light;
}
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; background: #151310; }
button, a { font: inherit; }
button { cursor: pointer; }
.app-shell {
  --bg: #151310;
  --surface: #201d19;
  --surface-raised: #29241f;
  --line: #3a332c;
  --text: #f3eee7;
  --muted: #a99f93;
  --accent: #c86f4a;
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--bg);
  color: var(--text);
  transition: background-color 180ms ease, color 180ms ease;
}
.app-shell[data-theme='light'] {
  --bg: #f3eee7;
  --surface: #fffaf2;
  --surface-raised: #ebe2d7;
  --line: #d3c6b8;
  --text: #211d19;
  --muted: #74695f;
  --accent: #b85f3d;
}
.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 18px clamp(20px, 4vw, 56px);
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  color: var(--text);
  font-weight: 650;
  letter-spacing: -0.02em;
  text-decoration: none;
}
.brand-mark {
  width: 12px;
  height: 12px;
  border: 2px solid var(--accent);
  transform: rotate(45deg);
}
.primary-nav {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--bg);
}
.primary-nav button,
.theme-toggle {
  border: 0;
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
  transition: color 160ms ease, background-color 160ms ease, transform 160ms ease;
}
.primary-nav button {
  padding: 8px 14px;
}
.primary-nav button[aria-pressed='true'] {
  color: var(--text);
  background: var(--surface-raised);
}
.theme-toggle {
  justify-self: end;
  padding: 9px 12px;
  border: 1px solid var(--line);
  text-transform: capitalize;
}
.primary-nav button:hover,
.theme-toggle:hover { color: var(--text); }
.primary-nav button:active,
.theme-toggle:active { transform: translateY(1px); }
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.workspace {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: clamp(64px, 10vw, 132px) 0 72px;
}
.eyebrow,
.foundation-panel span,
.status-line {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.eyebrow { margin: 0 0 18px; color: var(--accent); }
h1 {
  max-width: 760px;
  margin: 0;
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  line-height: 0.94;
  letter-spacing: -0.055em;
}
.lede {
  max-width: 52ch;
  margin: 24px 0 0;
  color: var(--muted);
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
}
.foundation-panel {
  max-width: 680px;
  margin-top: 72px;
  padding: 24px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.foundation-panel span { color: var(--muted); }
.foundation-panel p { margin: 14px 0 0; line-height: 1.6; }
.status-line {
  display: flex;
  justify-content: space-between;
  padding: 18px clamp(20px, 4vw, 56px);
  border-top: 1px solid var(--line);
  color: var(--muted);
}
@media (max-width: 720px) {
  .topbar { grid-template-columns: 1fr auto; }
  .primary-nav { grid-column: 1 / -1; grid-row: 2; justify-content: space-between; }
  .primary-nav button { flex: 1; }
  .workspace { width: min(100% - 32px, 1120px); padding-top: 56px; }
  .foundation-panel { margin-top: 48px; }
}
`;

export default tokens;
```

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import tokens from './styles/tokens.js';

const style = document.createElement('style');
style.dataset.productivemeTokens = '';
style.textContent = tokens;
document.head.append(style);

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [x] **Step 6: Run focused verification and verify GREEN**

Run:

```bash
PATH="/Users/a11791/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm --filter @productiveme/web test
PATH="/Users/a11791/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm --filter @productiveme/web typecheck
PATH="/Users/a11791/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm --filter @productiveme/web build
```

Expected: 3 passing tests; typecheck and production build exit 0.

- [x] **Step 7: Run repository verification**

Run:

```bash
PATH="/Users/a11791/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm test
PATH="/Users/a11791/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm typecheck
PATH="/Users/a11791/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm lint
git diff --check
```

Expected: all commands exit 0.

- [x] **Step 8: Commit the implementation slice**

```bash
git add docs/superpowers/plans/2026-07-25-phase3-web-foundation.md apps/web pnpm-lock.yaml
git commit -m "feat(web): add Phase 3 application shell"
```
