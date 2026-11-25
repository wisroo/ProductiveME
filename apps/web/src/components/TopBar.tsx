import type { AppTab, PrimaryTab, Theme } from '../types.js';

type TopBarProps = {
  activeTab: AppTab;
  theme: Theme;
  onTabChange: (tab: PrimaryTab) => void;
  onAddTask: () => void;
  onOpenSettings: () => void;
  onThemeToggle: () => void;
};

const tabs: ReadonlyArray<{ id: PrimaryTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'plan', label: 'Plan' },
  { id: 'review', label: 'Review' },
  { id: 'registry', label: 'Registry' },
];

function currentWeekLabel(now: Date) {
  // Use local calendar dates, with UTC arithmetic to avoid daylight-saving shifts.
  const monday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const thursday = new Date(monday);
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.floor((thursday.getTime() - yearStart) / 604_800_000) + 1;
  const sameMonth = monday.getUTCMonth() === sunday.getUTCMonth();
  const format = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const end = sameMonth ? sunday.getUTCDate() : format.format(sunday);
  return `WK ${String(week).padStart(2, '0')} · ${format.format(monday).toUpperCase()}–${String(end).toUpperCase()}`;
}

export default function TopBar({ activeTab, theme, onTabChange, onAddTask, onOpenSettings, onThemeToggle }: TopBarProps) {
  const targetTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="shell-header">
      <div className="shell-brand hf"><span aria-hidden="true" />ProductiveME</div>
      <nav aria-label="Primary" className="shell-nav">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={activeTab === id || (id === 'home' && activeTab === 'domain')}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="shell-actions mono">
        <button type="button" className="shell-button shell-add" onClick={onAddTask}>+ Task</button>
        <span className="shell-week" aria-label="Current week">{currentWeekLabel(new Date())}</span>
        <button type="button" className="shell-button" aria-current={activeTab === 'settings' ? 'page' : undefined} onClick={onOpenSettings}>⚙ Settings</button>
        <button type="button" className="shell-button" aria-label={`Switch to ${targetTheme} theme`} onClick={onThemeToggle}>
          {theme === 'dark' ? '◐ Light' : '◑ Dark'}
        </button>
      </div>
    </header>
  );
}
