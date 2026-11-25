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
  --hfont-fallback: system-ui, sans-serif;
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
  --hfont-fallback: Georgia, serif;
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
  font-family: var(--hfont), var(--hfont-fallback);
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
.shell-brand { display: flex; align-items: center; gap: 9px; font-size: 17px; font-weight: 600; letter-spacing: -.01em; padding-right: 13px; }
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
.shell-actions { display: flex; align-items: center; gap: 16px; margin-left: auto; }
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
.shell-week { font-size: 11px; color: var(--faint); white-space: nowrap; }

.handoff-page { max-width: 980px; margin: 0 auto; padding: 28px 24px; }
.handoff-home { display: flex; flex-direction: column; gap: 20px; }
.handoff-domain-back { max-width: 980px; margin: 0 auto; padding: 20px 24px 0; }
.handoff-eyebrow { color: var(--accent); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; margin: 0 0 6px; }
.handoff-title { max-width: 650px; margin-top: 9px; font-size: 30px; line-height: 1.16; font-weight: 600; letter-spacing: -.015em; }
.handoff-home { padding-inline: 30px; }
.home-source-banner, .home-empty {
  border: 1px solid var(--line);
  border-radius: var(--r2);
  background: var(--panel);
  padding: 14px 16px;
}
.home-source-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-color: var(--blocked);
  border-left-width: 3px;
}
.home-source-banner b { color: var(--blocked); text-transform: uppercase; font-size: 11px; letter-spacing: .1em; }
.home-source-banner p, .home-empty p { margin: 6px 0 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
.home-banner-action { flex-shrink: 0; padding: 8px 14px; border: 0; border-radius: var(--r); background: var(--blocked-fill); color: #20170a; font-size: 12px; font-weight: 700; cursor: pointer; }
.home-domain-section.query-section { border: 0; padding: 0; }
.home-domain-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 10px; }
.home-domain-card {
  background: var(--panel); padding: 15px 16px; text-align: left; color: var(--ink); border: 1px solid var(--line);
  border-top-width: 2px; border-radius: var(--r); cursor: pointer; transition: background .15s ease;
}
.home-card-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 5px; }
.home-card-progress { margin-top: 14px; }
.home-card-note { margin: 9px 0 0; color: var(--muted); font-size: 9px; }
.home-today {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--line-2);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--r2) var(--r2) 0;
  background: var(--panel);
}
.query-section { border: 1px solid var(--line); border-radius: var(--r2); padding: 16px 18px; overflow-wrap: anywhere; }
.query-section-title { font-size: 10px; letter-spacing: .14em; color: var(--muted); margin: 0 0 12px; }
.home-today > .query-section { border: 0; border-left: 1px solid var(--line); border-radius: 0; padding: 18px 20px; }
.home-today .query-section h2 { text-transform: uppercase; }
.home-today p.hf { font-size: 16px; line-height: 1.6; margin: 11px 0 16px; }
.home-today .home-today-action { padding: 11px 17px; font-size: 13px; }
.home-actions { display: grid; gap: 9px; list-style: none; margin: 0; padding: 0; }
.home-actions li { padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r); font-size: 12px; }
.home-actions li[data-priority='true'] { border-left: 2px solid var(--due-fill); }
.home-action-detail { font-size: 9px; color: var(--muted); margin-top: 2px; }
.home-actions li[data-priority='true'] .home-action-detail { color: var(--due); }
.home-timeline {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px; padding-top: 16px; border-top: 1px solid var(--line-2);
}
.home-timeline .query-section {
  border: 0; padding: 0; color: var(--muted);
  font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 2;
}
.home-timeline .query-section h2 { font-size: 9px; text-transform: uppercase; margin-bottom: 9px; }
.home-timeline .query-section:nth-child(1) h2 { color: var(--faint); }
.home-timeline .query-section:nth-child(2) h2 { color: var(--blocked); }
.home-timeline .query-section:nth-child(3) h2 { color: var(--due); }
.home-timeline .query-section p { margin: 0; }
.home-source-gates {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  border: 1px dashed var(--line-2);
  border-radius: var(--r);
  padding: 13px 16px;
}
.home-source-gates button { border: 0; padding: 0; background: none; color: var(--accent); font-size: 11px; cursor: pointer; }
.home-source-gates button:first-child { color: var(--muted); }

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
  .handoff-home { padding-inline: 16px; }
  .home-today, .home-timeline { grid-template-columns: minmax(0, 1fr); }
  .home-source-banner { flex-wrap: wrap; }
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
