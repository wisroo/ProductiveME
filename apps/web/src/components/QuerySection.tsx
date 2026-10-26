import type { ReactNode } from 'react';
import { ghostButton } from './bits.js';

type QuerySectionProps = {
  title: string;
  isPending: boolean;
  isError: boolean;
  error?: Error | null;
  empty: boolean;
  onRetry: () => void;
  children: ReactNode;
};

export default function QuerySection({
  title,
  isPending,
  isError,
  error,
  empty,
  onRetry,
  children,
}: QuerySectionProps) {
  return (
    <section
      aria-label={title}
      style={{
        border: '1px solid var(--line)',
        borderRadius: 'var(--r2)',
        padding: '16px 18px',
      }}
    >
      <h2
        className="mono"
        style={{
          fontSize: '10px',
          letterSpacing: '.14em',
          color: 'var(--muted)',
          margin: '0 0 12px',
        }}
      >
        {title}
      </h2>
      {isPending ? (
        <p role="status">Loading {title.toLowerCase()}…</p>
      ) : isError ? (
        <div role="alert">
          <p>{error?.message || `Could not load ${title.toLowerCase()}.`}</p>
          <button type="button" onClick={onRetry} style={ghostButton}>
            Retry {title.toLowerCase()}
          </button>
        </div>
      ) : empty ? (
        <p>No {title.toLowerCase()} yet.</p>
      ) : (
        children
      )}
    </section>
  );
}
