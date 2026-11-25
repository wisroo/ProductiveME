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

/* Secondary screens follow the shipped handoff frames while using live data. */
.domain-page, .review-page, .plan-page, .preferences-page { display: grid; gap: 16px; }
.review-page, .plan-page, .preferences-page { max-width: 860px; }
.domain-page > h1, .review-header h1, .plan-header h1, .preferences-page h1 { font-size: 24px; font-weight: 600; }
.domain-navigation, .review-header, .plan-header, .plan-view-controls {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.domain-navigation { border-bottom: 1px solid var(--line); }
.domain-tabs { display: flex; flex-wrap: wrap; }
.domain-tabs button {
  padding: 10px 14px; border: 0; border-bottom: 2px solid transparent;
  background: none; color: var(--muted); cursor: pointer; font-size: 12px;
}
.domain-tabs button[aria-pressed='true'] { color: var(--ink); border-bottom-color: var(--accent); font-weight: 700; }
.quiet-link { padding: 0; border: 0; color: var(--accent); background: none; font-size: 11px; cursor: pointer; }
.domain-overview { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-width: 0; }
.domain-overview:empty { display: none; }
.domain-status-panel, .domain-task-list > .query-section, .domain-linked, .review-draft, .carry-panel,
.plan-task-grid .this-week-panel, .preferences-panel { background: var(--panel); }
.domain-overview .domain-status-panel { border-left: 3px solid var(--accent); }
.domain-status-panel p { font-size: 13px; line-height: 1.5; }
.domain-status-panel small { display: block; color: var(--muted); line-height: 1.55; font-size: 9px; }
.status-chip { display: inline-flex; border: 1px solid currentColor; color: var(--muted); border-radius: 99px; padding: 2px 7px; font-size: 9px; }
.status-chip[data-status="blocked"], .status-chip[data-status="neglected"], .status-chip[data-status="overloaded"] { color: var(--blocked); }
.status-chip[data-status="attention"] { color: var(--due); }
.status-chip[data-status="on-track"] { color: var(--done); }
.domain-next { border-top: 1px solid var(--line); padding-top: 10px; margin-bottom: 10px; display: grid; gap: 5px; justify-items: start; }
.domain-next .hf { font-size: 16px; }
.screen-primary { padding: 7px 12px; border: 0; border-radius: var(--r); color: var(--accent-ink); background: var(--accent); cursor: pointer; font-weight: 700; font-size: 12px; }
.screen-primary:disabled { opacity: .6; }
.domain-page .domain-linked { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 9px 12px; }
.domain-linked .query-section-title { margin: 0; text-transform: uppercase; }
.domain-linked > button { margin-left: auto; }
.linked-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; margin: 0; list-style: none; }
.linked-chips li { border: 1px solid var(--line); border-radius: 20px; padding: 3px 8px; color: var(--muted); font-size: 10px; }
.folder-cards { grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr)); }
.folder-cards details { background: var(--panel); border-top: 2px solid var(--accent); }
.folder-cards summary { font-weight: 600; cursor: pointer; }

.screen-pill, .screen-segment button {
  border: 1px solid var(--line-2); border-radius: 99px; background: var(--panel); color: var(--muted);
  padding: 5px 11px; font-size: 11px;
}
button.screen-pill, .screen-segment button { cursor: pointer; }
.screen-segment { display: inline-flex; align-items: center; gap: 1px; padding: 3px; border: 1px solid var(--line-2); border-radius: 99px; background: var(--panel); }
.screen-segment button { border: 0; background: none; }
.screen-segment button[aria-pressed="true"] { color: var(--accent-ink); background: var(--accent); font-weight: 700; }
.screen-segment button:disabled { cursor: default; opacity: .65; }
.plan-page .plan-focus-panel { border-left: 3px solid var(--accent); background: var(--panel); }
.plan-focus input, .review-decisions textarea, .preferences-panel select {
  color: var(--ink); background: var(--bg); border: 1px solid var(--line-2);
  padding: 7px 9px; border-radius: var(--r); font: inherit; min-width: 0;
}
.plan-focus input { flex: 1; }
.plan-page .plan-caps, .plan-page .plan-timetable, .life-blocks { padding: 0; border: 0; }
.plan-cap-cards { grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); }
.plan-cap-cards > div { padding: 11px; background: var(--panel); border: 1px solid var(--line); border-top: 2px solid var(--cap-color, var(--done)); border-radius: var(--r); font-size: 12px; }
.plan-cap-cards [data-domain="finance"] { --cap-color: var(--due); }
.plan-cap-cards [data-domain="personal-data"] { --cap-color: var(--parked); }
.plan-cap-cards [data-domain="life"] { --cap-color: var(--blocked); }
.plan-cap-cards .task-summary { margin-bottom: 8px; }
.plan-task-grid { grid-template-columns: 1fr 1fr; align-items: start; }
.plan-task-grid .carry-panel { grid-column: 1; grid-row: 1; border-top-color: var(--due); }
.plan-task-grid .this-week-panel { grid-column: 2; grid-row: 1; border-top-color: var(--accent); }
.task-board-flat { grid-template-columns: 1fr; }
.domain-task-list .this-week-panel, .plan-task-grid .query-section, .review-tasks .this-week-panel { font-size: 12px; }
.review-tasks .task-board > section { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 0 10px 8px; }
.review-tasks .task-board > section:first-child { border-top-color: var(--due); }
.review-tasks .task-board > section:last-child { border-top-color: var(--done); }
.plan-timetable .schedule-grid, .life-blocks .schedule-grid { background: var(--panel); }
.plan-timetable .schedule-grid td, .life-blocks .schedule-grid td { border: 1px solid var(--line); padding: 3px; }
.schedule-grid td button[data-scheduled="false"] { border-color: transparent; opacity: .7; }
.schedule-grid td button[data-scheduled="true"] { background: var(--panel-2); border-left: 2px solid var(--accent); color: var(--ink); }
.plan-protection { padding: 4px 0; }

.review-draft { border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: var(--r2); padding: 16px 18px; min-width: 0; }
.review-page .query-section-title, .plan-page .query-section-title, .domain-page .query-section-title { text-transform: uppercase; }
.review-decisions { display: grid; gap: 6px; color: var(--muted); font-size: 11px; }
.review-decisions textarea { box-sizing: border-box; width: 100%; background: var(--panel); }
.review-archive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.review-archive-list, .finance-legend, .finance-detail-list { margin: 0; padding: 0; list-style: none; }
.review-archive-list { border: 1px solid var(--line); border-radius: var(--r2); overflow: hidden; }
.review-archive-list li + li { border-top: 1px solid var(--line); }
.review-archive-list button { display: grid; gap: 4px; width: 100%; padding: 10px 13px; text-align: left; border: 0; background: var(--panel); color: var(--ink); cursor: pointer; }
.review-archive-list button[aria-pressed="true"] { background: var(--panel-2); box-shadow: inset 2px 0 var(--accent); }
.review-archive-list small { color: var(--muted); font-size: 9px; }
.review-archive-detail h2 { margin: 4px 0; }
.review-archive-copy { white-space: pre-wrap; overflow-wrap: anywhere; }
.monthly-review-panel { background: var(--panel); }
.monthly-review-panel .monthly-task-grid { gap: 0; }
.monthly-review-panel .monthly-task-grid > button { border-radius: 0; border-color: var(--line); min-height: 48px; }
.monthly-metrics, .finance-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 12px 0; border: 1px solid var(--line); border-radius: var(--r); background: var(--panel); }
.monthly-metrics > div, .finance-stat-grid > * { display: grid; gap: 4px; padding: 10px 12px; }
.monthly-metrics > div + div, .finance-stat-grid > * + * { border-left: 1px solid var(--line); }
.monthly-metrics small, .finance-stat-grid small { color: var(--muted); font-size: 9px; text-transform: uppercase; }

.preferences-page { gap: 10px; }
.preferences-page .handoff-eyebrow { margin-bottom: 0; }
.preferences-panel { border: 1px solid var(--line); border-radius: var(--r2); }
.preference-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 13px 16px; font-size: 13px; }
.preference-row + .preference-row { border-top: 1px solid var(--line); }
.preference-row small { display: block; color: var(--muted); margin-top: 3px; }
.preferences-panel select { background: transparent; font-size: 11px; font-family: 'JetBrains Mono', monospace; }

.registry-page .registry-source-table { padding: 0; background: var(--panel); }
.registry-source-table .registry-row { padding: 11px 14px; }
.registry-source-table .registry-status-error, .registry-source-table > p, .registry-source-table > [role="alert"] { padding-inline: 14px; }
.registry-source-table .registry-row > div:first-child { position: relative; padding-left: 21px; }
.registry-source-table .registry-row > div:first-child::before { content: ''; position: absolute; left: 1px; top: 7px; width: 8px; height: 8px; border-radius: 50%; background: var(--faint); }
.registry-source-table .registry-row:has(.registry-sync[data-state="synced"]) > div:first-child::before { background: var(--done-fill); }
.registry-source-table .registry-row:has(.registry-sync[data-state="unavailable"]) > div:first-child::before { background: var(--blocked-fill); }
.registry-source-table .registry-sync > span[aria-hidden="true"] { display: none; }
.registry-source-table .registry-row .registry-retry:last-of-type { border-color: transparent; }
.source-dialog .registry-detail { overflow-wrap: anywhere; margin-top: 0; }
.source-drawer-state { border-bottom: 1px solid var(--line); padding-bottom: 12px; }
.screen-radio { min-width: 0; display: flex; flex-wrap: wrap; gap: 6px; border: 0; margin: 0; padding: 0; }
.screen-radio legend { margin-bottom: 5px; color: var(--muted); font-size: 10px; text-transform: uppercase; }
.task-dialog .screen-radio label { position: relative; display: flex; align-items: center; }
.screen-radio input { position: absolute; opacity: 0; }
.screen-radio span { border: 1px solid var(--line-2); border-radius: 99px; padding: 4px 9px; color: var(--muted); font-size: 11px; cursor: pointer; }
.screen-radio input:checked + span { border-color: var(--accent); color: var(--ink); background: var(--panel-2); }
.screen-radio input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }

.finance-records .finance-overview { border: 0; padding: 0; }
.finance-records .finance-overview .query-section-title { margin-bottom: 0; }
.finance-overview p { color: var(--muted); font-size: 12px; }
.finance-history-preview { display: flex; flex-wrap: wrap; border: 1px solid var(--line); background: var(--panel); border-radius: var(--r); }
.finance-history-preview button { display: grid; text-align: left; gap: 3px; flex: 1 1 110px; padding: 8px 11px; border: 0; color: var(--ink); background: transparent; cursor: pointer; }
.finance-history-preview time { color: var(--muted); font-size: 9px; }
.finance-history-preview > p { margin: 10px 12px; }
.finance-stat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.finance-stat-grid button { border: 0; background: transparent; color: var(--ink); text-align: left; cursor: pointer; }
.finance-stat-grid [data-missing="true"] { color: var(--due); }
.finance-breakdowns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.finance-composition { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
.finance-donut { display: grid; place-items: center; width: 104px; height: 104px; border-radius: 50%; flex-shrink: 0; }
.finance-donut span { display: grid; place-items: center; border-radius: 50%; background: var(--bg); width: 66%; height: 66%; font-size: 9px; }
.finance-legend li { display: flex; gap: 5px; align-items: center; color: var(--muted); font-size: 10px; margin: 4px 0; }
.finance-legend li span { width: 7px; height: 7px; background: var(--accent); }
.finance-legend li[data-tone="done"] span { background: var(--done); }
.finance-legend li[data-tone="parked"] span { background: var(--parked); }
.finance-legend li[data-tone="due"] span { background: var(--due); }
.finance-detail-list li { margin: 9px 0; display: grid; gap: 5px; font-size: 12px; }
.finance-amounts { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }

@media (max-width: 639px) {
  .domain-overview, .plan-task-grid, .review-archive-grid, .finance-breakdowns { grid-template-columns: minmax(0, 1fr); }
  .plan-task-grid .carry-panel, .plan-task-grid .this-week-panel { grid-column: auto; grid-row: auto; }
  .plan-task-grid .carry-panel { order: -1; }
  .finance-stat-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .finance-stat-grid > *:nth-child(3) { border-left: 0; }
  .finance-stat-grid > *:nth-child(n+3) { border-top: 1px solid var(--line); }
  .registry-source-table .registry-row { padding-inline: 10px; }
  .review-header { gap: 8px; }
}

.life-slot-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.schedule-grid td button[aria-pressed="true"] { border-color: var(--accent); color: var(--ink); }
.task-dialog-inline { border: 1px solid var(--line); border-radius: var(--r2); background: var(--panel); padding: 13px; min-width: 0; }
.task-dialog-inline form, .task-dialog-inline label { display: grid; gap: 6px; }
.task-dialog-inline h2 { margin: 0; }
.task-dialog-inline input, .task-dialog-inline select {
  min-width: 0; font: inherit; color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: var(--r); padding: 7px;
}
.life-slot-context { display: grid; gap: 5px; color: var(--muted); padding: 8px 0; font-size: 10px; overflow-wrap: anywhere; }
.task-carry .study-count { display: grid; grid-template-columns: minmax(60px, 1fr) minmax(25px, 1fr) auto; font-size: 11px; }
.study-count meter { width: 100%; accent-color: var(--accent); }
@media (max-width: 639px) {
  .life-slot-layout { grid-template-columns: minmax(0, 1fr); }
}

.review-page { --review-text: 'Public Sans', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans CJK KR', sans-serif; }
.review-readable-copy, .review-live-summary, .review-domain-summary, .review-decisions textarea, .review-draft textarea, .monthly-day-tasks {
  font-family: var(--review-text);
  line-height: 1.6;
  word-break: keep-all;
  overflow-wrap: anywhere;
  min-width: 0;
}
.review-live-summary { font-size: 16px; margin-bottom: 7px; }
.review-draft-hint { color: var(--muted); font-size: 12px; line-height: 1.5; }
.review-domain-summary li { align-items: baseline; }
.review-domain-summary li > b { flex-shrink: 0; }
.review-domain-summary li > span { text-align: right; }
.monthly-calendar-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.monthly-calendar-heading time { font-size: 16px; }
.monthly-legend { display: flex; gap: 8px; font: 10px 'JetBrains Mono', monospace; }
.monthly-done { color: var(--done); }
.monthly-open { color: var(--ink); }
.monthly-review-panel .monthly-task-grid > button {
  min-width: 0; padding: 3px 2px; align-content: start;
  color: var(--ink); font-variant-numeric: tabular-nums;
}
.monthly-day { font-size: 11px; }
.monthly-counts { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; column-gap: 2px; font-size: 9px; }
.monthly-counts > span { white-space: nowrap; }
.monthly-counts > .monthly-open { background: var(--track); border-radius: 3px; padding-inline: 2px; }
.monthly-legend > span::before { content: ''; display: inline-block; width: 5px; height: 5px; margin-right: 4px; border: 1px solid currentColor; border-radius: 100%; }
.monthly-legend > .monthly-done::before { background: currentColor; }
.monthly-day-tasks li span { min-width: 0; }
.monthly-day-tasks li small { flex-shrink: 0; color: var(--muted); }
@media (max-width: 639px) {
  .shell-nav { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .shell-nav button { padding-inline: 3px; font-size: 13px; }
  .monthly-review-panel { padding-inline: 10px; }
  .review-domain-summary li { flex-wrap: wrap; gap: 0 8px; }
  .review-domain-summary li > span { text-align: left; }
}
`;

export default tokens;
