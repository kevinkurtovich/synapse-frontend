import '@/styles/atoms.css';

type ValidationStatusBadgeProps = {
  status: 'PASS' | 'FAIL' | 'NO_RUNS';
};

const LABEL_MAP: Record<ValidationStatusBadgeProps['status'], string> = {
  PASS: 'Identity intact',
  FAIL: 'Identity degraded',
  NO_RUNS: 'Not validated',
};

const CLASS_MAP: Record<ValidationStatusBadgeProps['status'], string> = {
  PASS: 'validation-badge validation-badge--pass',
  FAIL: 'validation-badge validation-badge--fail',
  NO_RUNS: 'validation-badge validation-badge--no-runs',
};

export default function ValidationStatusBadge({ status }: ValidationStatusBadgeProps) {
  return <span className={CLASS_MAP[status]}>{LABEL_MAP[status]}</span>;
}
