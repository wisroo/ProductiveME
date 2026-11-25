import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RegistrySource, SourceInput } from '@productiveme/api-client';
import { toApiDomainId, useApi } from '../lib/api.js';
import { domains } from '../types.js';
import { primaryButton } from './bits.js';

const kinds = [
  { id: 'github', label: 'GitHub repository' },
  { id: 'notion', label: 'Notion page' },
  { id: 'notion-data-source', label: 'Notion data source' },
  { id: 'managed-folder', label: 'Folder' },
  { id: 'link', label: 'Link' },
] as const;

type Props = {
  onClose: () => void;
  source?: RegistrySource;
  remove?: boolean;
  sourceCount: number;
  health?: { status: string; lastGoodReadAt: string | null; lastAttemptAt: string | null } | undefined;
  onRetry?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
  retrying?: boolean | undefined;
};

export default function SourceDialog({ source, remove, sourceCount, onClose, health, onRetry, onRemove, retrying }: Props) {
  const api = useApi();
  const client = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<SourceInput['connector']>('github');
  const test = useMutation({ mutationFn: (input: SourceInput) => api.testSource(input) });
  const save = useMutation({
    mutationFn: async (input: SourceInput | undefined) => {
      if (source && remove) await api.removeSource(source.id);
      else if (source && input) await api.updateSource(source.id, { name: input.name, domain: input.domain });
      else if (input) await api.registerSource(input);
    },
    onSuccess: async () => {
      await Promise.all(['registry', 'source-health', 'snapshots', 'signals', 'domains', 'home-status', 'domain-status'].map((key) => client.invalidateQueries({ queryKey: [key] })));
      onClose();
    },
  });
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    if (element && !element.open) element.showModal();
    return () => { if (trigger instanceof HTMLElement) trigger.focus(); };
  }, []);

  function input(): SourceInput | undefined {
    if (!form.current?.reportValidity()) return undefined;
    const data = new FormData(form.current);
    const field = data.get('domain');
    const domain = field === 'tools' ? 'tools' : domains.map(({ id }) => toApiDomainId(id)).find((id) => id === field);
    if (!domain) return undefined;
    return {
      name: String(data.get('name') ?? '').trim(), connector: kind,
      domain, locator: String(data.get('locator') ?? ''),
    };
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = input();
    if (remove || payload) save.mutate(payload);
  };
  const busy = save.isPending || test.isPending;
  return (
    <dialog ref={dialog} className={`task-dialog source-dialog ${source && !remove ? 'task-drawer' : ''}`} aria-labelledby="source-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <form ref={form} onSubmit={submit} onChange={() => test.reset()}>
        <header className="task-summary">
          <div><p className="handoff-eyebrow mono">{source ? 'Source' : 'Registry'}</p><h2 id="source-dialog-title" className="hf">{remove ? 'Remove source' : source ? source.name : 'Register source'}</h2></div>
          <button type="button" className="quiet-link" aria-label="Close source dialog" onClick={onClose}>×</button>
        </header>
        {source && !remove && <div className="source-drawer-state">
          <p className="registry-detail mono">{source.connector} · {source.locator}</p>
          <p className="handoff-eyebrow mono">Recent activity</p>
          <ul className="finance-detail-list">
            <li>Last attempt · {health?.lastAttemptAt ? new Date(health.lastAttemptAt).toLocaleString() : 'No attempt recorded'}</li>
            <li>Last good read · {health?.lastGoodReadAt ? new Date(health.lastGoodReadAt).toLocaleString() : 'No successful read recorded'}</li>
          </ul>
          <div className="task-summary">
            {onRetry && <button type="button" className="screen-primary" disabled={retrying} onClick={onRetry}>{retrying ? 'Retrying…' : 'Retry now'}</button>}
            {onRemove && <button type="button" className="shell-button" onClick={onRemove}>Disconnect</button>}
          </div>
        </div>}
        {remove ? (
          <p>Remove {source?.name} from ProductiveME? The original source and saved snapshots will stay in place.
            {sourceCount === 1 ? ' Home will show its empty state until you register a source.' : ''}
          </p>
        ) : (
          <>
            {!source && <>
              <fieldset className="screen-radio"><legend>Source type</legend>{kinds.map(({ id, label }) => (
                <label key={id}><input type="radio" name="connector" value={id} checked={kind === id} disabled={busy} onChange={() => setKind(id)} /><span>{label}</span></label>
              ))}</fieldset>
              <label>{kind === 'managed-folder' ? 'Absolute folder path' : 'URL or source ID'} <input name="locator" required maxLength={2048} disabled={busy} /></label>
            </>}
            <label>Name <input name="name" defaultValue={source?.name} required maxLength={120} disabled={busy} /></label>
            <label>Domain <select name="domain" defaultValue={source?.domain ?? 'career'} disabled={busy}>
              {domains.map(({ id, label }) => <option key={id} value={toApiDomainId(id)}>{label}</option>)}
              <option value="tools">Toolbox</option>
            </select></label>
            {!source && <p>ProductiveME reads from this source using the connector configured on the server.</p>}
          </>
        )}
        {test.data && <p role="status">{test.data.reachable ? 'Reachable ✓' : 'Could not read this source with the current configuration.'}</p>}
        {test.isError && <p role="alert">{test.error.message}</p>}
        {save.isError && <p role="alert">{save.error.message}</p>}
        <div className="task-actions">
          {!source && kind !== 'link' && <button type="button" className="shell-button" disabled={busy} onClick={() => {
            const candidate = input();
            if (candidate) test.mutate(candidate);
          }}>{test.isPending ? 'Testing…' : 'Test connection'}</button>}
          <button type="button" className="shell-button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} style={primaryButton}>{remove ? 'Remove' : source ? 'Save' : 'Register'}</button>
        </div>
      </form>
    </dialog>
  );
}
