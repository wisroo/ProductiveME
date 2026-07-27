import { domains, type DomainId } from '../types.js';

type HomeProps = {
  onDomainSelect: (domain: DomainId) => void;
};

export default function Home({ onDomainSelect }: HomeProps) {
  return (
    <>
      <p className="eyebrow">Personal operating system</p>
      <h1>Today, at a glance</h1>
      <p className="lede">
        A focused read on the four domains shaping your week.
      </p>
      <section className="domain-grid" aria-label="Life domains">
        {domains.map((domain) => (
          <button
            key={domain.id}
            type="button"
            aria-label={domain.label}
            onClick={() => onDomainSelect(domain.id)}
          >
            <span>{domain.label}</span>
            <span aria-hidden="true">Open domain</span>
          </button>
        ))}
      </section>
    </>
  );
}
