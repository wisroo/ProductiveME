import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Domains from './components/Domains.js';
import Home from './components/Home.js';
import Registry from './components/Registry.js';
import Review from './components/Review.js';
import TopBar from './components/TopBar.js';
import type { AppTab, DomainId, ReviewMode, Theme } from './types.js';

function AppContent() {
  const [tab, setTab] = useState<AppTab>('home');
  const [domain, setDomain] = useState<DomainId>('finance');
  const [reviewMode, setReviewMode] = useState<ReviewMode>('weekly');
  const [theme, setTheme] = useState<Theme>('dark');

  const openDomain = (nextDomain: DomainId) => {
    setDomain(nextDomain);
    setTab('domain');
  };

  return (
    <div
      data-theme={theme}
      style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <TopBar
        activeTab={tab}
        theme={theme}
        onTabChange={setTab}
        onOpenSettings={() => setTab('settings')}
        onThemeToggle={() =>
          setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
        }
      />
      <main id="main-content">
        {tab === 'home' ? (
          <Home
            onDomainSelect={openDomain}
            onOpenDomains={() => setTab('domain')}
            onOpenRegistry={() => setTab('registry')}
            onStartReview={() => {
              setReviewMode('weekly');
              setTab('review');
            }}
          />
        ) : tab === 'review' ? (
          <Review mode={reviewMode} onModeChange={setReviewMode} />
        ) : tab === 'domain' ? (
          <>
            <div className="handoff-domain-back">
              <button type="button" className="shell-button" onClick={() => setTab('home')}>← Home</button>
            </div>
            <Domains activeDomain={domain} onDomainChange={setDomain} />
          </>
        ) : tab === 'registry' ? (
          <Registry />
        ) : tab === 'settings' ? (
          <section className="handoff-page">
            <h1 className="hf">Settings</h1>
            <label>
              Theme{' '}
              <select value={theme} onChange={(event) => setTheme(event.target.value === 'light' ? 'light' : 'dark')}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
          </section>
        ) : (
          <section className="handoff-page">
            <h1 className="hf">Plan</h1>
            <p>Weekly planning will be available when task storage is connected.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>;
}
