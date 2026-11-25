import { useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Domains from './components/Domains.js';
import FinanceRecords from './components/FinanceRecords.js';
import { useApi } from './lib/api.js';
import Home from './components/Home.js';
import MonthlyTasks from './components/MonthlyTasks.js';
import Registry from './components/Registry.js';
import Review from './components/Review.js';
import { LifeSchedule, Plan } from './components/Schedule.js';
import TopBar from './components/TopBar.js';
import { QuickTaskDialog, WeeklyTasks } from './components/Tasks.js';
import { adjacentWeek, localDate, weekOfDate, weekStart } from './lib/week.js';
import type { AppTab, DomainId, ReviewMode, Theme } from './types.js';

function AppContent() {
  const api = useApi();
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api.getSettings() });
  const saveSettings = useMutation({
    mutationFn: (reviewDefault: ReviewMode) => api.updateSettings({ reviewDefault }),
    onSuccess: (value) => queryClient.setQueryData(['settings'], value),
  });
  const [tab, setTab] = useState<AppTab>('home');
  const [domain, setDomain] = useState<DomainId>('finance');
  const [chosenReviewMode, setReviewMode] = useState<ReviewMode | null>(null);
  const reviewMode = chosenReviewMode ?? settings.data?.reviewDefault ?? 'weekly';
  const [addingTask, setAddingTask] = useState<{ date?: string; domain?: DomainId } | null>(null);
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
        onTabChange={(next) => { if (next === 'review' && tab !== 'review') setReviewMode(null); setTab(next); }}
        onAddTask={() => setAddingTask({})}
        onOpenSettings={() => setTab('settings')}
        onThemeToggle={() =>
          setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
        }
      />
      <main id="main-content">
        {tab === 'home' ? (
          <Home
            week={week}
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
            <Domains week={week} activeDomain={domain} onDomainChange={setDomain} taskPanel={<WeeklyTasks week={week} domain={domain} onAdd={() => setAddingTask({ domain })} />} domainPanel={domain === 'life' ? <LifeSchedule week={week} nextWeek={adjacentWeek(week, 1)} /> : domain === 'finance' ? <FinanceRecords week={week} /> : undefined} />
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
            <p>
              <label>Review opens on{' '}
                <select value={settings.data?.reviewDefault ?? 'weekly'} disabled={!settings.isSuccess || saveSettings.isPending}
                  onChange={(event) => saveSettings.mutate(event.target.value === 'monthly' ? 'monthly' : 'weekly')}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </p>
            {settings.isError && <p role="alert">Could not load settings. <button type="button" className="shell-button" onClick={() => void settings.refetch()}>Retry</button></p>}
            {saveSettings.isError && <p role="alert">Could not save the review preference.</p>}
          </section>
        ) : (
          <Plan week={week} onAdd={() => setAddingTask({})} />
        )}
      </main>
      {addingTask && <QuickTaskDialog week={addingTask.date ? weekOfDate(addingTask.date) : week} {...(addingTask.date ? { date: addingTask.date } : {})} {...(addingTask.domain ? { domain: addingTask.domain } : {})} onClose={() => setAddingTask(null)} />}
    </div>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>;
}
