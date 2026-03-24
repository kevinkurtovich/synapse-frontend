import '@/styles/molecules.css';

type TraitSectionProps = {
  title: string;
  traitJson: Record<string, unknown> | null;
};

export default function TraitSection({ title, traitJson }: TraitSectionProps) {
  const isEmpty = !traitJson || Object.keys(traitJson).length === 0;

  return (
    <div className="trait-section">
      <h5 className="trait-section__title">{title}</h5>
      <div className="trait-section__content">
        {isEmpty ? (
          <span className="trait-section__empty">&mdash;</span>
        ) : (
          Object.entries(traitJson).map(([key, val]) => (
            <div key={key} className="trait-section__row">
              <span className="trait-section__key">{key}</span>
              <span className="trait-section__val">
                {typeof val === 'string'
                  ? val
                  : typeof val === 'number' || typeof val === 'boolean'
                    ? String(val)
                    : JSON.stringify(val)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
