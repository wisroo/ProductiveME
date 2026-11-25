import type { ReactNode } from 'react';
import { ghostButton } from './bits.js';

type QuerySectionProps = {
  title: string;
  className?: string;
  hideTitle?: boolean;
  isPending: boolean;
  isError: boolean;
  error?: Error | null;
  empty: boolean;
  onRetry?: () => void;
  children: ReactNode;
};

export default function QuerySection({
  title,
  className,
  hideTitle = false,
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
      className={className ? `query-section ${className}` : 'query-section'}
    >
      {!hideTitle && <h2 className="query-section-title mono">{title}</h2>}
      {isPending ? (
        <p role="status">Loading {title.toLowerCase()}…</p>
      ) : isError ? (
        <div role="alert">
          <p>{error?.message || `Could not load ${title.toLowerCase()}.`}</p>
          {onRetry && <button type="button" onClick={onRetry} style={ghostButton}>
            Retry {title.toLowerCase()}
          </button>}
        </div>
      ) : empty ? (
        <p>No {title.toLowerCase()} yet.</p>
      ) : (
        children
      )}
    </section>
  );
}
