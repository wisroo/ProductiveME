import { useState } from 'react';
import TopBar from './components/TopBar.js';

export type PrimaryTab = 'home' | 'review' | 'mcp';
export type Theme = 'dark' | 'light';

const views = {
  home: {
    eyebrow: 'Personal operating system',
    heading: 'Today, at a glance',
    description: 'A focused read on the four domains shaping your week.',
  },
  review: {
    eyebrow: 'Weekly review',
    heading: 'Review your trajectory',
    description: 'Turn recent signals into one deliberate adjustment.',
  },
  mcp: {
    eyebrow: 'Connected context',
    heading: 'MCP connections',
    description: 'See which systems can contribute trusted context.',
  },
} as const;

export default function App() {
  const [tab, setTab] = useState<PrimaryTab>('home');
  const [theme, setTheme] = useState<Theme>('dark');
  const view = views[tab];

  return (
    <div className="app-shell" data-theme={theme}>
      <TopBar
        activeTab={tab}
        theme={theme}
        onTabChange={setTab}
        onThemeToggle={() =>
          setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
        }
      />
      <main className="workspace" id="main-content">
        <p className="eyebrow">{view.eyebrow}</p>
        <h1>{view.heading}</h1>
        <p className="lede">{view.description}</p>
        <section
          className="foundation-panel"
          aria-label={`${view.heading} preview`}
        >
          <span>Phase 3 foundation</span>
          <p>The detailed {tab} view arrives as its own tested roadmap slice.</p>
        </section>
      </main>
      <footer className="status-line">
        <span>Local prototype</span>
        <span>Static data</span>
      </footer>
    </div>
  );
}
