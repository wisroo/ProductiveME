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

.shell-header {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 22px;
  border-bottom: 1px solid var(--line-2);
  background: var(--bg);
}
.shell-brand { display: flex; align-items: center; gap: 9px; font-size: 17px; font-weight: 700; }
.shell-brand span { width: 20px; height: 20px; border-radius: 4px; background: var(--accent); }
.shell-nav { display: flex; }
.shell-nav button {
  padding: 15px 18px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
}
.shell-nav button[aria-pressed='true'] { color: var(--ink); border-color: var(--accent); font-weight: 700; }
.shell-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.shell-button {
  padding: 6px 11px;
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  background: transparent;
  color: var(--muted);
  font-size: 11px;
  cursor: pointer;
}
.shell-button:disabled { cursor: default; opacity: .65; }
.shell-add { background: var(--accent); color: var(--accent-ink); font-weight: 700; }
.shell-week { font-size: 10px; color: var(--muted); white-space: nowrap; }

.handoff-page { max-width: 980px; margin: 0 auto; padding: 28px 24px; }
.handoff-home { display: flex; flex-direction: column; gap: 20px; }
.handoff-domain-back { max-width: 980px; margin: 0 auto; padding: 20px 24px 0; }
.handoff-eyebrow { color: var(--accent); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; margin: 0 0 6px; }
.handoff-title { max-width: 640px; }
.handoff-home .hf, .registry-page .hf, .shell-brand { font-family: 'Newsreader', Georgia, serif; }
.home-source-banner, .home-empty {
  border: 1px solid var(--line);
  border-radius: var(--r2);
  background: var(--panel);
  padding: 12px 16px;
}
.home-source-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-color: var(--blocked);
  border-left-width: 3px;
}
.home-source-banner b { color: var(--blocked); text-transform: uppercase; font-size: 11px; }
.home-source-banner p, .home-empty p { margin: 4px 0; color: var(--muted); font-size: 13px; }
.home-card-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 5px; }
.home-today {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: var(--r2);
  background: var(--panel);
}
.query-section { border: 1px solid var(--line); border-radius: var(--r2); padding: 16px 18px; overflow-wrap: anywhere; }
.home-today > .query-section { border: 0; border-left: 1px solid var(--line); border-radius: 0; }
.home-today p.hf { font-size: 20px; line-height: 1.4; }
.home-actions { margin: 0; padding-left: 20px; }
.home-actions li + li { border-top: 1px solid var(--line); }
.home-timeline { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.home-source-gates {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  border: 1px dashed var(--line-2);
  border-radius: var(--r);
  padding: 8px 10px;
}
.home-source-gates button { border: 0; background: none; color: var(--accent); font-size: 11px; cursor: pointer; }

.registry-page { max-width: 860px; }
.registry-header { display: flex; justify-content: space-between; align-items: end; gap: 12px; margin-bottom: 14px; }
.registry-header > span { font-size: 11px; color: var(--muted); }
.registry-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.registry-filters button, .registry-chip {
  border: 1px solid var(--line-2);
  border-radius: 999px;
  padding: 5px 10px;
  background: transparent;
  color: var(--muted);
  font-size: 11px;
}
.registry-filters button { cursor: pointer; }
.registry-filters button[aria-pressed='true'] { border-color: var(--accent); color: var(--ink); background: var(--panel-2); }
.registry-list { list-style: none; margin: 0; padding: 0; }
.registry-row {
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1fr) auto minmax(150px, auto);
  gap: 12px;
  padding: 12px 0;
  overflow-wrap: anywhere;
}
.registry-row + .registry-row { border-top: 1px solid var(--line); }
.registry-detail, .registry-sync { font-size: 10px; color: var(--muted); }
.registry-detail { margin-top: 4px; }
.registry-sync[data-state='synced'] { color: var(--done); }
.registry-sync[data-state='unavailable'] { color: var(--blocked); }
.registry-status-error { margin-bottom: 8px; }
.source-name { border: 0; background: none; color: var(--ink); font-weight: 700; padding: 0; cursor: pointer; text-align: left; }
.registry-retry { margin-left: 8px; }
.registry-retry-result { display: block; margin-top: 4px; }

.weekly-tasks, .task-dialog form { display: grid; gap: 12px; }
.task-dialog { color: var(--ink); background: var(--panel); border: 1px solid var(--line-2); border-radius: var(--r2); width: min(420px, calc(100vw - 40px)); box-sizing: border-box; }
.task-drawer { margin: 0 0 0 auto; min-height: 100dvh; }
.task-dialog::backdrop { background: #0009; }
.task-dialog h2 { margin: 0; }
.task-dialog label { display: grid; gap: 4px; }
.task-dialog input, .task-dialog select, .task-dialog textarea { min-width: 0; font: inherit; color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: var(--r); padding: 7px; }
.task-actions, .task-summary { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
.task-board { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.domain-folder-list { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
.domain-folder-list details { border: 1px solid var(--line); padding: 9px; }
.schedule-scroll { overflow-x: auto; }
.schedule-grid { border-collapse: collapse; width: 100%; }
.schedule-grid th { padding: 5px; font-size: 11px; color: var(--muted); }
.schedule-grid td { padding: 3px; min-width: 65px; }
.schedule-grid td button { width: 100%; min-height: 32px; text-align: left; overflow-wrap: anywhere; }
.schedule-grid small { display: block; color: var(--muted); }
.schedule-notes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.monthly-task-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; text-align: center; }
.monthly-task-grid > span { font-size: 10px; color: var(--muted); }
.monthly-task-grid button { display: grid; gap: 3px; min-height: 40px; padding: 3px; }
.monthly-task-grid button[aria-pressed='true'] { border-color: var(--accent); color: var(--ink); background: var(--panel-2); }
.task-board h3 { color: var(--muted); font-size: 11px; text-transform: uppercase; }
.task-board ul, .task-carry { list-style: none; padding: 0; margin: 0; }
.task-board li, .task-carry li { display: flex; justify-content: space-between; gap: 8px; align-items: center; padding: 6px 0; }
.task-board li { justify-content: flex-start; }
.task-board li + li, .task-carry li + li { border-top: 1px solid var(--line); }
@media (max-width: 639px) {
  .task-board { grid-template-columns: 1fr; }
  .task-dialog { width: 100%; max-width: none; min-height: 0; margin: auto 0 0; border-radius: 10px 10px 0 0; }
}

@media (max-width: 850px) {
  .shell-header { flex-wrap: wrap; gap: 0 10px; padding: 8px 16px 0; }
  .shell-nav { order: 3; width: 100%; }
  .shell-nav button { padding: 10px 12px; }
}
@media (max-width: 639px) {
  .shell-week { display: none; }
  .handoff-page { padding: 20px 16px; }
  .home-today, .home-timeline { grid-template-columns: minmax(0, 1fr); }
  .home-today > .query-section { border-left: 0; border-top: 1px solid var(--line); }
  .registry-row { grid-template-columns: minmax(0, 1fr) auto; gap: 6px; }
  .registry-sync { grid-column: 1 / -1; }
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
