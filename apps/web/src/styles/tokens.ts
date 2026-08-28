const tokens = `
:root {
  --bg: #0a141e;
  --panel: #0f1e2b;
  --panel-2: #122636;
  --track: #081019;
  --line: rgba(51, 198, 232, 0.26);
  --line-2: rgba(51, 198, 232, 0.5);
  --tint-done: rgba(95, 214, 166, 0.2);
  --tint-due: rgba(232, 178, 74, 0.22);
  --tint-parked: rgba(127, 151, 168, 0.22);
  --tint-blocked: rgba(224, 104, 92, 0.22);
  --ink: #dde8f0;
  --muted: #84a0b2;
  --faint: #5f7789;
  --accent: #33c6e8;
  --accent-ink: #062430;
  --due: #e8b24a;
  --due-fill: #e8b24a;
  --blocked: #e0685c;
  --blocked-fill: #e0685c;
  --done: #5fd6a6;
  --done-fill: #5fd6a6;
  --parked: #7f97a8;
  --parked-fill: #6b7f90;
  --hfont: 'Space Grotesk';
  --r: 3px;
  --r2: 5px;
}

[data-theme='light'] {
  --bg: #f1eee6;
  --panel: #fbf9f3;
  --panel-2: #f6f2e9;
  --track: #e6e1d5;
  --line: rgba(52, 88, 104, 0.18);
  --line-2: rgba(52, 88, 104, 0.34);
  --tint-done: rgba(92, 108, 83, 0.1);
  --tint-due: rgba(253, 188, 0, 0.16);
  --tint-parked: rgba(172, 136, 135, 0.14);
  --tint-blocked: rgba(224, 128, 116, 0.14);
  --ink: #29302f;
  --muted: #6b7a80;
  --faint: #96a29e;
  --accent: #345868;
  --accent-ink: #ffffff;
  --due: #b58900;
  --due-fill: #fdbc00;
  --blocked: #c56b60;
  --blocked-fill: #e08074;
  --done: #5c6c53;
  --done-fill: #5c6c53;
  --parked: #ac8887;
  --parked-fill: #ac8887;
  --hfont: 'Newsreader';
}

body {
  margin: 0;
  background: var(--bg);
  font-family: 'Public Sans', system-ui, sans-serif;
  color: var(--ink);
}

a {
  color: var(--accent);
}

a:hover {
  opacity: 0.8;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}

.hf {
  font-family: var(--hfont), serif;
}

h1 {
  margin: 0;
}

button,
a {
  font: inherit;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.domain-card[data-tone='done']:hover {
  background: var(--tint-done);
}

.domain-card[data-tone='due']:hover {
  background: var(--tint-due);
}

.domain-card[data-tone='parked']:hover {
  background: var(--tint-parked);
}

.domain-card[data-tone='blocked']:hover {
  background: var(--tint-blocked);
}
`;

export default tokens;
