import '@/styles/molecules.css';

type ExportFormat = 'chatgpt' | 'claude' | 'json';

type ExportFormatTabProps = {
  formats: ExportFormat[];
  active: ExportFormat;
  onChange: (f: ExportFormat) => void;
};

const LABELS: Record<ExportFormat, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  json: 'JSON',
};

export default function ExportFormatTab({
  formats,
  active,
  onChange,
}: ExportFormatTabProps) {
  return (
    <div className="export-format-tabs">
      {formats.map((f) => (
        <button
          key={f}
          className={
            f === active
              ? 'export-format-tab export-format-tab--active'
              : 'export-format-tab'
          }
          onClick={() => onChange(f)}
        >
          {LABELS[f]}
        </button>
      ))}
    </div>
  );
}
