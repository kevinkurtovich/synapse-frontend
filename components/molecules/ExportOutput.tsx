import '@/styles/molecules.css';

type ExportOutputProps = {
  content: string;
  format: 'chatgpt' | 'claude' | 'json';
};

export default function ExportOutput({ content }: ExportOutputProps) {
  return (
    <pre className="export-output">{content}</pre>
  );
}
