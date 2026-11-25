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
] as const;

type Props = {
  onClose: () => void;
  source?: RegistrySource;
  remove?: boolean;
  sourceCount: number;
};

export default function SourceDialog({ source, remove, sourceCount, onClose }: Props) {
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

  function input() {
    if (!form.current?.reportValidity()) return undefined;
    const data = new FormData(form.current);
    const domain = domains.find(({ id }) => toApiDomainId(id) === data.get('domain'));
    if (!domain) return undefined;
    return {
      name: String(data.get('name') ?? '').trim(), connector: kind,
      domain: toApiDomainId(domain.id), locator: String(data.get('locator') ?? ''),
    };
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = input();
    if (remove || payload) save.mutate(payload);
  };
  const busy = save.isPending || test.isPending;
  return (
    <dialog ref={dialog} className="task-dialog" aria-labelledby="source-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <form ref={form} onSubmit={submit} onChange={() => test.reset()}>
        <h2 id="source-dialog-title" className="hf">{remove ? 'Remove source' : source ? 'Edit source' : 'Register source'}</h2>
        {remove ? (
          <p>Remove {source?.name} from ProductiveME? The original source and saved snapshots will stay in place.
            {sourceCount === 1 ? ' Home will show its empty state until you register a source.' : ''}
          </p>
        ) : (
          <>
            {!source && <>
              <label>Source type <select value={kind} disabled={busy} onChange={(event) => {
                const selected = kinds.find(({ id }) => id === event.target.value);
                if (selected) setKind(selected.id);
              }}>{kinds.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}</select></label>
              <label>{kind === 'managed-folder' ? 'Absolute folder path' : 'URL or source ID'} <input name="locator" required maxLength={2048} disabled={busy} /></label>
            </>}
            <label>Name <input name="name" defaultValue={source?.name} required maxLength={120} disabled={busy} /></label>
            <label>Domain <select name="domain" defaultValue={source?.domain ?? 'career'} disabled={busy}>
              {domains.map(({ id, label }) => <option key={id} value={toApiDomainId(id)}>{label}</option>)}
            </select></label>
            {!source && <p>ProductiveME reads from this source using the connector configured on the server.</p>}
          </>
        )}
        {test.data && <p role="status">{test.data.reachable ? 'Reachable ✓' : 'Could not read this source with the current configuration.'}</p>}
        {test.isError && <p role="alert">{test.error.message}</p>}
        {save.isError && <p role="alert">{save.error.message}</p>}
        <div className="task-actions">
          {!source && <button type="button" className="shell-button" disabled={busy} onClick={() => {
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
