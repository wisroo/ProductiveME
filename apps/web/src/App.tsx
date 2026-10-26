import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Domains from './components/Domains.js';
import Home from './components/Home.js';
import Mcp from './components/Mcp.js';
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
        onThemeToggle={() =>
          setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
        }
      />
      <main id="main-content">
        {tab === 'home' ? (
          <Home
            onDomainSelect={openDomain}
            onOpenDomains={() => setTab('domain')}
            onStartReview={() => setTab('review')}
          />
        ) : tab === 'review' ? (
          <Review mode={reviewMode} onModeChange={setReviewMode} />
        ) : tab === 'domain' ? (
          <Domains activeDomain={domain} onDomainChange={setDomain} />
        ) : (
          <Mcp />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>;
}
