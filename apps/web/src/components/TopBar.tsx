import type { AppTab, PrimaryTab, Theme } from '../types.js';

type TopBarProps = {
  activeTab: AppTab;
  theme: Theme;
  onTabChange: (tab: PrimaryTab) => void;
  onThemeToggle: () => void;
};

const tabs: ReadonlyArray<{ id: PrimaryTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'review', label: 'Review' },
  { id: 'mcp', label: 'MCP' },
];

export default function TopBar({
  activeTab,
  theme,
  onTabChange,
  onThemeToggle,
}: TopBarProps) {
  const targetTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="topbar">
      <a className="brand" href="#main-content" aria-label="ProductiveME home">
        <span className="brand-mark" aria-hidden="true" />
        <span>ProductiveME</span>
      </a>
      <nav className="primary-nav" aria-label="Primary">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <button
        className="theme-toggle"
        type="button"
        aria-label={`Switch to ${targetTheme} theme`}
        onClick={onThemeToggle}
      >
        {targetTheme}
      </button>
    </header>
  );
}
