import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Domains from './components/Domains.js';
import Home from './components/Home.js';
import MonthlyTasks from './components/MonthlyTasks.js';
import Registry from './components/Registry.js';
import Review from './components/Review.js';
import TopBar from './components/TopBar.js';
import { QuickTaskDialog, WeeklyTasks } from './components/Tasks.js';
import { localDate, weekOfDate, weekStart } from './lib/week.js';
import type { AppTab, DomainId, ReviewMode, Theme } from './types.js';

function AppContent() {
  const [tab, setTab] = useState<AppTab>('home');
  const [domain, setDomain] = useState<DomainId>('finance');
  const [reviewMode, setReviewMode] = useState<ReviewMode>('weekly');
  const [addingTask, setAddingTask] = useState<{ date?: string } | null>(null);
  const week = weekStart();
  const today = localDate();
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
        onAddTask={() => setAddingTask({})}
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
          <>
            <Review mode={reviewMode} onModeChange={setReviewMode} periodStart={reviewMode === 'weekly' ? week : `${today.slice(0, 7)}-01`} />
            <div className="handoff-page">
              {reviewMode === 'weekly'
                ? <WeeklyTasks week={week} onAdd={() => setAddingTask({})} />
                : <MonthlyTasks today={today} onAdd={(date) => setAddingTask({ date })} />}
            </div>
          </>
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
            <p className="handoff-eyebrow mono">Week of {week}</p>
            <WeeklyTasks week={week} onAdd={() => setAddingTask({})} carry />
          </section>
        )}
      </main>
      {addingTask && <QuickTaskDialog week={addingTask.date ? weekOfDate(addingTask.date) : week} {...(addingTask.date ? { date: addingTask.date } : {})} onClose={() => setAddingTask(null)} />}
    </div>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>;
}
