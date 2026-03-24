import '@/styles/molecules.css';

type VerdictSignalProps = {
  verdict: 'PASS' | 'FAIL';
};

const LABEL_MAP: Record<VerdictSignalProps['verdict'], string> = {
  PASS: 'Identity intact',
  FAIL: 'Identity degraded',
};

export default function VerdictSignal({ verdict }: VerdictSignalProps) {
  const className =
    verdict === 'PASS'
      ? 'verdict-signal verdict-signal--pass'
      : 'verdict-signal verdict-signal--fail';

  return (
    <div className={className}>
      <span className="verdict-signal__label">{LABEL_MAP[verdict]}</span>
    </div>
  );
}
