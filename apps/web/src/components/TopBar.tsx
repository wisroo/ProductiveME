import type { CSSProperties } from 'react';
import { week } from '../data/mock.js';
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

const tabStyle = (active: boolean): CSSProperties => ({
  padding: '15px 18px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: active ? 700 : 500,
  fontFamily: '"Public Sans",sans-serif',
  background: 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  color: active ? 'var(--ink)' : 'var(--muted)',
  marginBottom: '-1px',
});

export default function TopBar({
  activeTab,
  theme,
  onTabChange,
  onThemeToggle,
}: TopBarProps) {
  const targetTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '0 22px',
        borderBottom: '1px solid var(--line-2)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '15px 18px 15px 0',
          marginRight: '8px',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: 'var(--accent)',
          }}
        />
        <b
          className="hf"
          style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-.01em' }}
        >
          ProductiveME
        </b>
      </div>
      <nav aria-label="Primary" style={{ display: 'flex', gap: '2px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            style={tabStyle(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <span className="mono" style={{ fontSize: '11px', color: 'var(--faint)' }}>
          {week}
        </span>
        <button
          type="button"
          className="mono"
          aria-label={`Switch to ${targetTheme} theme`}
          onClick={onThemeToggle}
          style={{
            fontSize: '11px',
            padding: '6px 12px',
            border: '1px solid var(--line-2)',
            borderRadius: 'var(--r)',
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          {theme === 'dark' ? '◐ Light' : '◑ Dark'}
        </button>
      </div>
    </header>
  );
}
