import { useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Domains from './components/Domains.js';
import FinanceRecords, { FinanceDialog } from './components/FinanceRecords.js';
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
  const [recordingAssets, setRecordingAssets] = useState(false);
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
            onRecordAssets={() => setRecordingAssets(true)}
            onOpenRegistry={() => setTab('registry')}
            onStartReview={() => {
              setReviewMode('weekly');
              setTab('review');
            }}
          />
        ) : tab === 'review' ? (
          <Review
            mode={reviewMode}
            onModeChange={setReviewMode}
            periodStart={reviewMode === 'weekly' ? week : `${today.slice(0, 7)}-01`}
            taskPanel={reviewMode === 'weekly'
              ? <WeeklyTasks week={week} onAdd={() => setAddingTask({})} />
              : <MonthlyTasks today={today} onAdd={(date) => setAddingTask({ date })} />}
          />
        ) : tab === 'domain' ? (
          <Domains
            week={week}
            activeDomain={domain}
            onDomainChange={setDomain}
            onHome={() => setTab('home')}
            onRegistry={() => setTab('registry')}
            onRecordAssets={() => setRecordingAssets(true)}
            taskPanel={<WeeklyTasks week={week} domain={domain} onAdd={() => setAddingTask({ domain })} />}
            domainPanel={domain === 'life' ? <LifeSchedule week={week} nextWeek={adjacentWeek(week, 1)} /> : domain === 'finance' ? <FinanceRecords week={week} /> : undefined}
          />
        ) : tab === 'registry' ? (
          <Registry />
        ) : tab === 'settings' ? (
          <section className="handoff-page preferences-page">
            <p className="handoff-eyebrow mono">Settings</p>
            <h1 className="hf">Preferences</h1>
            <div className="preferences-panel">
              <label className="preference-row">
                <span><b>Theme</b><small>Choose a dark or light appearance.</small></span>
                <select value={theme} onChange={(event) => setTheme(event.target.value === 'light' ? 'light' : 'dark')}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <div className="preference-row">
                <span><b>Review opens on</b><small>Choose your default review period.</small></span>
                <div className="screen-segment" role="group" aria-label="Review opens on">
                  {(['weekly', 'monthly'] as const).map((value) => (
                    <button key={value} type="button" disabled={!settings.isSuccess || saveSettings.isPending}
                      aria-pressed={settings.data?.reviewDefault === value} onClick={() => saveSettings.mutate(value)}>
                      {value === 'weekly' ? 'Weekly' : 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {settings.isError && <p role="alert">Could not load settings. <button type="button" className="shell-button" onClick={() => void settings.refetch()}>Retry</button></p>}
            {saveSettings.isError && <p role="alert">Could not save the review preference.</p>}
          </section>
        ) : (
          <Plan week={week} onAdd={() => setAddingTask({})} />
        )}
      </main>
      {recordingAssets && <FinanceDialog week={week} onClose={() => setRecordingAssets(false)} />}
      {addingTask && <QuickTaskDialog week={addingTask.date ? weekOfDate(addingTask.date) : week} {...(addingTask.date ? { date: addingTask.date } : {})} {...(addingTask.domain ? { domain: addingTask.domain } : {})} onClose={() => setAddingTask(null)} />}
    </div>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>;
}
