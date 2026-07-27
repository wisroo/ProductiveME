import { domains, type DomainId } from '../types.js';

type DomainsProps = {
  activeDomain: DomainId;
  onDomainChange: (domain: DomainId) => void;
};

export default function Domains({
  activeDomain,
  onDomainChange,
}: DomainsProps) {
  const activeLabel = domains.find((domain) => domain.id === activeDomain)?.label;

  return (
    <>
      <p className="eyebrow">Domain focus</p>
      <h1>{activeLabel}</h1>
      <p className="lede">
        Review the connected work, signals, and next attention point for this
        domain.
      </p>
      <nav className="domain-nav" aria-label="Domains">
        {domains.map((domain) => (
          <button
            key={domain.id}
            type="button"
            aria-pressed={domain.id === activeDomain}
            onClick={() => onDomainChange(domain.id)}
          >
            {domain.label}
          </button>
        ))}
      </nav>
      <section
        className="foundation-panel"
        aria-label={`${activeLabel} preview`}
      >
        <span>Static prototype</span>
        <p>Detailed domain data arrives in the next typed mock-data slice.</p>
      </section>
    </>
  );
}
