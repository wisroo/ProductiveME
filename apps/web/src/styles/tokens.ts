const tokens = `
:root {
  font-family: 'Outfit', system-ui, sans-serif;
  color-scheme: dark light;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: #151310;
}

button,
a {
  font: inherit;
}

button {
  cursor: pointer;
}

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
  transition:
    background-color 180ms ease,
    color 180ms ease;
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
  transition:
    color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;
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
.theme-toggle:hover {
  color: var(--text);
}

.primary-nav button:active,
.theme-toggle:active {
  transform: translateY(1px);
}

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

.eyebrow {
  margin: 0 0 18px;
  color: var(--accent);
}

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

.foundation-panel span {
  color: var(--muted);
}

.foundation-panel p {
  margin: 14px 0 0;
  line-height: 1.6;
}

.status-line {
  display: flex;
  justify-content: space-between;
  padding: 18px clamp(20px, 4vw, 56px);
  border-top: 1px solid var(--line);
  color: var(--muted);
}

@media (max-width: 720px) {
  .topbar {
    grid-template-columns: 1fr auto;
  }

  .primary-nav {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: space-between;
  }

  .primary-nav button {
    flex: 1;
  }

  .workspace {
    width: min(100% - 32px, 1120px);
    padding-top: 56px;
  }

  .foundation-panel {
    margin-top: 48px;
  }
}
`;

export default tokens;
