export type PrimaryTab = 'home' | 'review' | 'mcp';
export type AppTab = PrimaryTab | 'domain';
export type DomainId = 'career' | 'finance' | 'pdata' | 'life';
export type Theme = 'dark' | 'light';
export type ReviewMode = 'weekly' | 'monthly';

/** Status palette shared by every view: maps onto the --done/--due/--parked/--blocked tokens. */
export type Tone = 'done' | 'due' | 'parked' | 'blocked';
/** Tones usable for bars and text that also reach for the neutral accent/ink tokens. */
export type BarTone = Tone | 'accent' | 'muted' | 'faint';

export const domains: ReadonlyArray<{ id: DomainId; label: string }> = [
  { id: 'career', label: 'Career' },
  { id: 'finance', label: 'Finance' },
  { id: 'pdata', label: 'Personal Data' },
  { id: 'life', label: 'Life' },
];

export type DomainCard = {
  id: DomainId;
  label: string;
  badge: string;
  badgeTone: BarTone;
  tone: Tone;
  progress: number;
  note: string;
};

export type NextAction = {
  rank: number;
  title: string;
  meta: string;
  tone: BarTone;
  flagged: boolean;
};

export type TimelineColumn = {
  label: string;
  tone: BarTone;
  lines: readonly string[];
};

export type DomainSummaryRow = {
  label: string;
  tone: Tone;
  summary: string;
};

export type StudyField = {
  label: string;
  percent: number;
  pages: string;
  tone: BarTone;
};

export type FunnelStage = {
  label: string;
  count: number;
  tone: BarTone;
};

export type StatCell = {
  label: string;
  value: string;
  note: string;
  tone: BarTone;
  flagged: boolean;
};

export type SpendRow = {
  label: string;
  percent: number;
  amount: string;
  tone: BarTone;
};

export type AssetSlice = {
  label: string;
  percent: number;
  tone: BarTone;
};

export type DataAsset = {
  label: string;
  size: string;
  detail: string;
  percent: number;
  tone: Tone;
  status: string;
};

/** One cell of the Life weekly timetable. */
export type TimeBlock = 'career' | 'rest' | 'active' | 'protected' | 'open';

export type TimetableRow = {
  label: string;
  blocks: readonly TimeBlock[];
};

export type McpStatus = 'connected' | 'down' | 'idle';

export type McpServer = {
  name: string;
  status: McpStatus;
  detail: string;
};
