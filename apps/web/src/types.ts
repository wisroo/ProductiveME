export type PrimaryTab = 'home' | 'review' | 'mcp';
export type AppTab = PrimaryTab | 'domain';
export type DomainId = 'career' | 'finance' | 'pdata' | 'life';
export type Theme = 'dark' | 'light';

export const domains: ReadonlyArray<{ id: DomainId; label: string }> = [
  { id: 'career', label: 'Career' },
  { id: 'finance', label: 'Finance' },
  { id: 'pdata', label: 'Personal Data' },
  { id: 'life', label: 'Life' },
];
