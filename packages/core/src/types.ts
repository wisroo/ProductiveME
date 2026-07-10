export const DOMAIN_IDS = ['career', 'finance', 'personal-data', 'life'] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];

export const SUBDOMAINS: Record<DomainId, readonly string[]> = {
  career: ['work', 'study', 'dream'],
  finance: ['cashflow', 'assets', 'spending', 'portfolio'],
  'personal-data': ['photos', 'music', 'videos', 'files', 'archives'],
  life: ['travel', 'exercise', 'games', 'church', 'rest', 'relationships', 'other'],
};

export const CADENCES = ['weekly', 'monthly', 'quarterly'] as const;
export type Cadence = (typeof CADENCES)[number];

export const ENTRY_KINDS = ['repo', 'notion-page', 'folder', 'tool', 'project'] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export interface RegistryEntry {
  id: string;
  name: string;
  kind: EntryKind;
  domain: DomainId;
  subdomain?: string;
  /** URL or filesystem path identifying the thing in its source system. */
  locator: string;
  /** Connector id, e.g. 'static-file', 'local-folder', 'github'. */
  connector: string;
  /** How often this entry should receive the user's attention. */
  cadence?: Cadence;
}

export interface SnapshotItem {
  title: string;
  detail?: string;
  /** ISO-8601. */
  timestamp?: string;
  link?: string;
}

export interface Snapshot {
  entryId: string;
  /** ISO-8601 time of the sync run. */
  fetchedAt: string;
  status: 'ok' | 'error';
  items: SnapshotItem[];
  error?: string;
}

export type SignalSeverity = 'info' | 'due' | 'warning' | 'blocked';

export interface Signal {
  severity: SignalSeverity;
  domain: DomainId;
  entryId?: string;
  message: string;
  suggestedAction?: string;
}

export function isDomainId(value: string): value is DomainId {
  return (DOMAIN_IDS as readonly string[]).includes(value);
}
