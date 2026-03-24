import '@/styles/molecules.css';

type ProfileOption = {
  id: string;
  provider: string;
  model_name: string;
  calibration_score: number;
};

type ExportProfileSelectorProps = {
  profiles: ProfileOption[];
  selectedId: string | null;
  onChange: (id: string) => void;
};

export default function ExportProfileSelector({
  profiles,
  selectedId,
  onChange,
}: ExportProfileSelectorProps) {
  return (
    <div className="export-profile-selector">
      {profiles.map((p) => (
        <button
          key={p.id}
          className={
            p.id === selectedId
              ? 'export-profile-selector__item export-profile-selector__item--selected'
              : 'export-profile-selector__item'
          }
          onClick={() => onChange(p.id)}
        >
          <span className="export-profile-selector__label">
            {p.provider} / {p.model_name}
          </span>
          <span className="export-profile-selector__score">
            Score: {p.calibration_score}
          </span>
        </button>
      ))}
    </div>
  );
}
