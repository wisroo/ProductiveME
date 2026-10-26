/**
 * Static data lifted verbatim from the Claude Design source of truth
 * (`ProductiveME Prototype.dc.html`, project 87aee349-30b5-49dc-9b69-e847d023298b).
 *
 * This is the single seam a later phase replaces with `packages/core` / the API.
 */
import type {
  AssetSlice,
  DataAsset,
  DomainCard,
  DomainSummaryRow,
  FunnelStage,
  McpServer,
  NextAction,
  SpendRow,
  StatCell,
  StudyField,
  TimelineColumn,
  TimetableRow,
} from '../types.js';

export const week = 'WK 29 · JUL 13–19';

export const home = {
  eyebrow: "Where am I · what changed · what's next",
  headline: ['This week, close the July finance snapshot', 'and give Life its time back.'],
  today: {
    label: 'TODAY · THU JUL 17',
    lead: 'Finance still needs the July snapshot — ',
    highlight: '2 days overdue',
    tail: ". Notion is offline, so log it locally. Then guard tonight's rest — Life has been quiet all week.",
    cta: '▶ Record July asset snapshot',
  },
  sourceGates: 'SOURCE GATES · Notion · Google Tasks · GitHub · Finance · Files',
} as const;

export const domainCards: readonly DomainCard[] = [
  {
    id: 'career',
    label: 'Career',
    badge: '3 open',
    badgeTone: 'muted',
    tone: 'done',
    progress: 70,
    note: 'next: cloud cert',
  },
  {
    id: 'finance',
    label: 'Finance',
    badge: 'DUE',
    badgeTone: 'due',
    tone: 'due',
    progress: 42,
    note: 'snapshot missing',
  },
  {
    id: 'pdata',
    label: 'Personal Data',
    badge: 'parked',
    badgeTone: 'muted',
    tone: 'parked',
    progress: 55,
    note: 'photos growing',
  },
  {
    id: 'life',
    label: 'Life',
    badge: 'NEGLECTED',
    badgeTone: 'blocked',
    tone: 'blocked',
    progress: 24,
    note: 'rest 6d',
  },
];

export const nextActions: readonly NextAction[] = [
  { rank: 1, title: 'Record July snapshot', meta: 'Finance · 2d overdue', tone: 'due', flagged: true },
  { rank: 2, title: 'Protect Sat exercise', meta: 'Life · this week', tone: 'muted', flagged: false },
  { rank: 3, title: 'Prep cloud cert outline', meta: 'Career · this week', tone: 'muted', flagged: false },
];

export const timeline: readonly TimelineColumn[] = [
  {
    label: '◂ PAST · WHAT CHANGED',
    tone: 'faint',
    lines: ['✓ portfolio script shipped', '✓ cloud module 4', '✓ church roster sent'],
  },
  {
    label: "● NOW · TODAY'S ISSUE",
    tone: 'blocked',
    lines: ['✕ Notion connector down', '! review not started', '⚠ snapshot missing'],
  },
  {
    label: '▸ NEXT · MOVES',
    tone: 'due',
    lines: ['→ record snapshot', '→ protect Sat block', '→ prep cloud cert'],
  },
];

export const review = {
  weekly: {
    title: 'Weekly review · Week 29',
    label: '✍ THIS WEEK, IN A SENTENCE',
    body: 'It was a genuinely busy week. Career threw up several obstacles — the Notion connector broke and the cert prep stalled — but there were warm moments with friends too. Finance quietly slipped: the July snapshot never got recorded.',
    emphasis: 'This week, how about focusing on yourself rather than the outside?',
    tail: ' Protect rest, close the finance loop early, and keep Career to three things.',
  },
  monthly: {
    title: 'Monthly review · July 2026',
    label: '✍ THIS MONTH, IN A SENTENCE',
    body: 'July has run hot on Career — 3 strong weeks of shipping, but rest and Finance kept slipping to the edges. The pattern is clear in the grid below: green clusters mid-week, red-and-idle weekends.',
    emphasis:
      'Next month, defend two rest days a week and lock the finance snapshot to the 1st.',
    tail: '',
  },
  decisionsPlaceholder:
    '▍ Protect Saturday for exercise. Record snapshot Monday. Cap Career at 3 tasks…',
  monthLabel: 'July 2026',
} as const;

export const weeklyRollup: readonly DomainSummaryRow[] = [
  { label: 'Career', tone: 'done', summary: '3 done · connector broke · cert stalled' },
  { label: 'Finance', tone: 'due', summary: 'snapshot missing · portfolio review due' },
  { label: 'Personal Data', tone: 'parked', summary: 'photos unmanaged · no action taken' },
  { label: 'Life', tone: 'blocked', summary: 'rest neglected 6d · but good time w/ friends' },
];

export const monthlyRollup: readonly DomainSummaryRow[] = [
  { label: 'Career', tone: 'done', summary: '18 done · best streak 5d · 3 blockers cleared' },
  { label: 'Finance', tone: 'due', summary: '2 of 4 snapshots · portfolio review overdue' },
  { label: 'Personal Data', tone: 'parked', summary: 'photos still unmanaged · no action' },
  { label: 'Life', tone: 'blocked', summary: 'rest 4 of 17d · exercise 2 blocks total' },
];

type LegendTone = 'done' | 'due' | 'blocked' | 'line';

export const heatmapLegend: ReadonlyArray<{ label: string; tone: LegendTone }> = [
  { label: 'strong', tone: 'done' },
  { label: 'partial', tone: 'due' },
  { label: 'rough', tone: 'blocked' },
  { label: 'idle', tone: 'line' },
];

export const career = {
  status: 'overloaded',
  scope: 'Work · Study · Dream',
  studyLabel: 'STUDY · WRITING BY FIELD',
  studySource: '● Notion DB',
  funnelLabel: 'NOTION → BLOG · RECOGNITION FLOW',
  draft: '▸ VPC design notes',
} as const;

export const studyFields: readonly StudyField[] = [
  { label: 'Cloud arch', percent: 75, pages: '18 pg', tone: 'accent' },
  { label: 'Networking', percent: 52, pages: '12 pg', tone: 'accent' },
  { label: 'AI systems', percent: 30, pages: '7 pg', tone: 'accent' },
  { label: 'CS fund.', percent: 20, pages: '5 pg', tone: 'parked' },
];

export const funnel: readonly FunnelStage[] = [
  { label: 'DRAFTED', count: 42, tone: 'muted' },
  { label: 'POLISH', count: 4, tone: 'due' },
  { label: 'PUBLISHED', count: 9, tone: 'done' },
];

export const finance = {
  status: 'attention',
  spendingLabel: 'SPENDING BY CATEGORY · JULY',
  compositionLabel: 'ASSET COMPOSITION',
  total: '84.2M',
  currency: '₩',
  overdue: { label: '◆ NEXT · OVERDUE', title: 'Record July asset snapshot', cta: '▶ Record now' },
} as const;

export const financeStats: readonly StatCell[] = [
  { label: 'NET WORTH', value: '₩ 84.2M', note: '▲ 1.8% MoM', tone: 'done', flagged: false },
  { label: 'CASH', value: '₩ 12.6M', note: '3.1 mo runway', tone: 'muted', flagged: false },
  { label: 'SPENT · JUL', value: '₩ 2.35M', note: '78% budget', tone: 'done', flagged: false },
  { label: 'SNAPSHOT', value: 'Missing', note: 'last Jun 30', tone: 'due', flagged: true },
];

export const spending: readonly SpendRow[] = [
  { label: 'Housing', percent: 82, amount: '₩820k', tone: 'parked' },
  { label: 'Food', percent: 54, amount: '₩540k', tone: 'parked' },
  { label: 'Transport', percent: 33, amount: '₩330k', tone: 'parked' },
  { label: 'Subscript.', percent: 22, amount: '₩220k', tone: 'due' },
  { label: 'Leisure', percent: 18, amount: '₩180k', tone: 'parked' },
];

export const assetSlices: readonly AssetSlice[] = [
  { label: 'Investments', percent: 46, tone: 'done' },
  { label: 'Cash', percent: 28, tone: 'accent' },
  { label: 'Savings', percent: 16, tone: 'parked' },
  { label: 'Other', percent: 10, tone: 'due' },
];

export const pdata = { summary: '62% organized · 5 need attention' } as const;

export const dataAssets: readonly DataAsset[] = [
  {
    label: '2025 Photos',
    size: '18.4 GB',
    detail: '4,210 · 3,100 untagged',
    percent: 26,
    tone: 'due',
    status: '26% organized',
  },
  {
    label: '2024 Photos',
    size: '14.1 GB',
    detail: '3,020 · tagged',
    percent: 92,
    tone: 'done',
    status: '92% organized',
  },
  {
    label: '2024 Projects',
    size: '9.7 GB',
    detail: '28 folders · 11 stale',
    percent: 48,
    tone: 'due',
    status: '48% archived',
  },
  {
    label: 'Paper / PDF',
    size: '3.2 GB',
    detail: '640 docs · 90 unsorted',
    percent: 70,
    tone: 'done',
    status: '70% sorted',
  },
  {
    label: 'Music',
    size: '8.9 GB',
    detail: '2,140 · no tags',
    percent: 12,
    tone: 'parked',
    status: 'parked',
  },
  {
    label: 'Videos',
    size: '28.0 GB',
    detail: '310 · 60 to cull',
    percent: 55,
    tone: 'parked',
    status: '55% reviewed',
  },
];

export const life = {
  status: 'neglected',
  scope: 'weekly timetable',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  highlightDay: 'Sat',
  imbalance: {
    label: '⚠ IMBALANCE',
    body: 'Career fills 5 of 7 mornings & afternoons. Exercise = 0 blocks. Rest only weekend.',
  },
  protect: {
    label: '◆ PROTECT THIS WEEK',
    title: 'Sat afternoon → exercise',
    cta: '▶ Protect block',
  },
} as const;

export const timetableLegend = [
  { label: 'Career', block: 'career' },
  { label: 'Rest / Church', block: 'rest' },
  { label: 'Exercise / Games', block: 'active' },
  { label: 'Protected (guard it)', block: 'protected' },
] as const;

export const timetable: readonly TimetableRow[] = [
  {
    label: 'Morning',
    blocks: ['career', 'career', 'career', 'career', 'career', 'protected', 'rest'],
  },
  {
    label: 'Afternoon',
    blocks: ['career', 'career', 'career', 'career', 'career', 'protected', 'rest'],
  },
  {
    label: 'Evening',
    blocks: ['career', 'open', 'active', 'open', 'rest', 'active', 'rest'],
  },
];

export const mcp = { summary: '5 connected · 1 down', add: '+ add MCP server' } as const;

export const mcpServers: readonly McpServer[] = [
  { name: 'Notion', status: 'down', detail: 'down · retry' },
  { name: 'Google Tasks', status: 'connected', detail: 'connected' },
  { name: 'GitHub', status: 'connected', detail: 'connected' },
  { name: 'finance-repo', status: 'connected', detail: 'connected' },
  { name: 'Local files', status: 'idle', detail: 'idle' },
];
