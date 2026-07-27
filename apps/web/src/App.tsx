import { useState } from 'react';
import Domains from './components/Domains.js';
import Home from './components/Home.js';
import TopBar from './components/TopBar.js';
import type { AppTab, DomainId, PrimaryTab, Theme } from './types.js';

const views = {
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
} satisfies Record<Exclude<PrimaryTab, 'home'>, {
  eyebrow: string;
  heading: string;
  description: string;
}>;

export default function App() {
  const [tab, setTab] = useState<AppTab>('home');
  const [domain, setDomain] = useState<DomainId>('finance');
  const [theme, setTheme] = useState<Theme>('dark');

  const openDomain = (nextDomain: DomainId) => {
    setDomain(nextDomain);
    setTab('domain');
  };

  const content =
    tab === 'home' ? (
      <Home onDomainSelect={openDomain} />
    ) : tab === 'domain' ? (
      <Domains activeDomain={domain} onDomainChange={setDomain} />
    ) : (
      <>
        <p className="eyebrow">{views[tab].eyebrow}</p>
        <h1>{views[tab].heading}</h1>
        <p className="lede">{views[tab].description}</p>
        <section
          className="foundation-panel"
          aria-label={`${views[tab].heading} preview`}
        >
          <span>Phase 3 foundation</span>
          <p>The detailed {tab} view arrives as its own tested roadmap slice.</p>
        </section>
      </>
    );

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
        {content}
      </main>
      <footer className="status-line">
        <span>Local prototype</span>
        <span>Static data</span>
      </footer>
    </div>
  );
}
